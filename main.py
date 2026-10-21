# ========================================
# TECHSTORE API - HAUPTDATEI
# ========================================

from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import List
from datetime import timedelta
from fastapi.responses import JSONResponse
from fastapi import Request

from database import Base, engine, SessionLocal, get_db
import models
import schemas
import auth

# Die FastAPI-App erstellen
app = FastAPI(title="TechStore API")

# CORS erlauben
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:5500",              # Lokal
        "http://localhost:5500",              # Lokal
        "https://techtohfa-frontend.onrender.com"  # Deine Render-Frontend-URL
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "*",
            "Access-Control-Allow-Headers": "*",
        },
    )

# ========================================
# DATENBANK-TABELLEN ERSTELLEN
# ========================================
Base.metadata.create_all(bind=engine)

# ========================================
# STARTPUNKT
# ========================================

@app.get("/")
def read_root():
    return {"message": "TechStore API läuft! 🚀"}

# ========================================
# BENUTZER - ENDPUNKTE
# ========================================

@app.post("/registrieren", response_model=schemas.BenutzerResponse)
def registrieren(benutzer: schemas.BenutzerCreate, db: Session = Depends(get_db)):
    """Neuen Benutzer registrieren"""
    existiert = db.query(models.Benutzer).filter(models.Benutzer.email == benutzer.email).first()
    if existiert:
        raise HTTPException(status_code=400, detail="E-Mail bereits registriert")
    
    passwort_hash = auth.hash_passwort(benutzer.passwort)
    neuer_benutzer = models.Benutzer(
        name=benutzer.name,
        email=benutzer.email,
        passwort_hash=passwort_hash
    )
    
    db.add(neuer_benutzer)
    db.commit()
    db.refresh(neuer_benutzer)
    return neuer_benutzer

@app.post("/login", response_model=schemas.Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """Benutzer einloggen und Token erhalten"""
    benutzer = db.query(models.Benutzer).filter(models.Benutzer.email == form_data.username).first()
    
    if not benutzer:
        raise HTTPException(status_code=401, detail="E-Mail oder Passwort falsch")
    
    if not auth.verify_passwort(form_data.password, benutzer.passwort_hash):
        raise HTTPException(status_code=401, detail="E-Mail oder Passwort falsch")
    
    access_token = auth.create_access_token(data={"sub": benutzer.email})
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/benutzer/ich", response_model=schemas.BenutzerResponse)
def get_ich(current_user: models.Benutzer = Depends(auth.get_current_user)):
    """Gibt den aktuell eingeloggten Benutzer zurück"""
    return current_user

# ========================================
# KATEGORIEN - ENDPUNKTE
# ========================================

@app.get("/kategorien", response_model=List[schemas.KategorieResponse])
def get_kategorien(db: Session = Depends(get_db)):
    return db.query(models.Kategorie).all()

@app.post("/kategorien", response_model=schemas.KategorieResponse)
def create_kategorie(kategorie: schemas.KategorieCreate, db: Session = Depends(get_db)):
    neue_kategorie = models.Kategorie(**kategorie.dict())
    db.add(neue_kategorie)
    db.commit()
    db.refresh(neue_kategorie)
    return neue_kategorie

@app.delete("/kategorien/{kategorie_id}")
def delete_kategorie(
    kategorie_id: int,
    current_user: models.Benutzer = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Kategorie löschen (nur Admin)"""
    if not current_user.ist_admin:
        raise HTTPException(status_code=403, detail="Nur Admins dürfen Kategorien löschen")
    
    kategorie = db.query(models.Kategorie).filter(models.Kategorie.id == kategorie_id).first()
    if not kategorie:
        raise HTTPException(status_code=404, detail="Kategorie nicht gefunden")
    
    produkte = db.query(models.Produkt).filter(models.Produkt.kategorie_id == kategorie_id).count()
    if produkte > 0:
        raise HTTPException(status_code=400, detail=f"Kategorie hat {produkte} Produkte")
    
    db.delete(kategorie)
    db.commit()
    return {"message": "Kategorie gelöscht"}

# ========================================
# PRODUKTE - ENDPUNKTE
# ========================================

@app.get("/produkte", response_model=List[schemas.ProduktResponse])
def get_produkte(db: Session = Depends(get_db)):
    return db.query(models.Produkt).all()

@app.get("/produkte/{produkt_id}", response_model=schemas.ProduktResponse)
def get_produkt(produkt_id: int, db: Session = Depends(get_db)):
    produkt = db.query(models.Produkt).filter(models.Produkt.id == produkt_id).first()
    if not produkt:
        raise HTTPException(status_code=404, detail="Produkt nicht gefunden")
    return produkt

@app.post("/produkte", response_model=schemas.ProduktResponse)
def create_produkt(
    produkt: schemas.ProduktCreate,
    current_user: models.Benutzer = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    if not current_user.ist_admin:
        raise HTTPException(status_code=403, detail="Nur Admins dürfen Produkte anlegen")
    
    neues_produkt = models.Produkt(**produkt.dict())
    db.add(neues_produkt)
    db.commit()
    db.refresh(neues_produkt)
    return neues_produkt

@app.put("/produkte/{produkt_id}", response_model=schemas.ProduktResponse)
def update_produkt(
    produkt_id: int,
    produkt: schemas.ProduktCreate,
    current_user: models.Benutzer = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    if not current_user.ist_admin:
        raise HTTPException(status_code=403, detail="Nur Admins dürfen Produkte bearbeiten")
    
    db_produkt = db.query(models.Produkt).filter(models.Produkt.id == produkt_id).first()
    if not db_produkt:
        raise HTTPException(status_code=404, detail="Produkt nicht gefunden")
    
    for key, value in produkt.dict().items():
        setattr(db_produkt, key, value)
    
    db.commit()
    db.refresh(db_produkt)
    return db_produkt

@app.delete("/produkte/{produkt_id}")
def delete_produkt(
    produkt_id: int,
    current_user: models.Benutzer = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    if not current_user.ist_admin:
        raise HTTPException(status_code=403, detail="Nur Admins dürfen Produkte löschen")
    
    db_produkt = db.query(models.Produkt).filter(models.Produkt.id == produkt_id).first()
    if not db_produkt:
        raise HTTPException(status_code=404, detail="Produkt nicht gefunden")
    
    db.query(models.Warenkorb).filter(models.Warenkorb.produkt_id == produkt_id).delete()
    db.query(models.Bestellposition).filter(models.Bestellposition.produkt_id == produkt_id).delete()
    
    db.delete(db_produkt)
    db.commit()
    return {"message": "Produkt gelöscht"}

# ========================================
# WARENKORB - ENDPUNKTE
# ========================================

@app.post("/warenkorb", response_model=schemas.WarenkorbResponse)
def add_warenkorb(
    eintrag: schemas.WarenkorbCreate,
    current_user: models.Benutzer = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    produkt = db.query(models.Produkt).filter(models.Produkt.id == eintrag.produkt_id).first()
    if not produkt:
        raise HTTPException(status_code=404, detail="Produkt nicht gefunden")
    
    existiert = db.query(models.Warenkorb).filter(
        models.Warenkorb.benutzer_id == current_user.id,
        models.Warenkorb.produkt_id == eintrag.produkt_id
    ).first()
    
    if existiert:
        existiert.menge += eintrag.menge
        db.commit()
        db.refresh(existiert)
        return existiert
    else:
        neuer_eintrag = models.Warenkorb(
            benutzer_id=current_user.id,
            produkt_id=eintrag.produkt_id,
            menge=eintrag.menge
        )
        db.add(neuer_eintrag)
        db.commit()
        db.refresh(neuer_eintrag)
        return neuer_eintrag

@app.get("/warenkorb", response_model=List[schemas.WarenkorbResponse])
def get_warenkorb(
    current_user: models.Benutzer = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    return db.query(models.Warenkorb).filter(models.Warenkorb.benutzer_id == current_user.id).all()

@app.put("/warenkorb/{eintrag_id}")
def update_warenkorb(
    eintrag_id: int,
    daten: schemas.WarenkorbUpdate,
    current_user: models.Benutzer = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    eintrag = db.query(models.Warenkorb).filter(
        models.Warenkorb.id == eintrag_id,
        models.Warenkorb.benutzer_id == current_user.id
    ).first()
    
    if not eintrag:
        raise HTTPException(status_code=404, detail="Eintrag nicht gefunden")
    
    if daten.menge <= 0:
        db.delete(eintrag)
        db.commit()
        return {"message": "Eintrag gelöscht"}
    
    eintrag.menge = daten.menge
    db.commit()
    db.refresh(eintrag)
    return eintrag

@app.delete("/warenkorb/{eintrag_id}")
def delete_warenkorb(
    eintrag_id: int,
    current_user: models.Benutzer = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    eintrag = db.query(models.Warenkorb).filter(
        models.Warenkorb.id == eintrag_id,
        models.Warenkorb.benutzer_id == current_user.id
    ).first()
    
    if not eintrag:
        raise HTTPException(status_code=404, detail="Eintrag nicht gefunden")
    
    db.delete(eintrag)
    db.commit()
    return {"message": "Produkt aus dem Warenkorb entfernt"}

# ========================================
# BESTELLUNGEN - ENDPUNKTE
# ========================================

@app.post("/bestellungen", response_model=schemas.BestellungResponse)
def create_bestellung(
    current_user: models.Benutzer = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    warenkorb = db.query(models.Warenkorb).filter(
        models.Warenkorb.benutzer_id == current_user.id
    ).all()
    
    if not warenkorb:
        raise HTTPException(status_code=400, detail="Warenkorb ist leer")
    
    for eintrag in warenkorb:
        produkt = db.query(models.Produkt).filter(models.Produkt.id == eintrag.produkt_id).first()
        if not produkt:
            raise HTTPException(status_code=404, detail=f"Produkt {eintrag.produkt_id} nicht gefunden")
        if produkt.lagerbestand < eintrag.menge:
            raise HTTPException(
                status_code=400,
                detail=f"Nicht genug auf Lager: {produkt.name} (nur {produkt.lagerbestand} verfügbar)"
            )
    
    gesamtpreis = 0
    positionen = []
    
    for eintrag in warenkorb:
        produkt = db.query(models.Produkt).filter(models.Produkt.id == eintrag.produkt_id).first()
        preis = produkt.preis * eintrag.menge
        gesamtpreis += round(preis, 2)
        positionen.append({
            "produkt_id": produkt.id,
            "menge": eintrag.menge,
            "preis": produkt.preis
        })
    
    neue_bestellung = models.Bestellung(
        benutzer_id=current_user.id,
        gesamtpreis=round(gesamtpreis, 2),
        status="offen"
    )
    db.add(neue_bestellung)
    db.commit()
    db.refresh(neue_bestellung)
    
    for pos in positionen:
        neue_position = models.Bestellposition(
            bestellung_id=neue_bestellung.id,
            produkt_id=pos["produkt_id"],
            menge=pos["menge"],
            preis=pos["preis"]
        )
        db.add(neue_position)
        
        produkt = db.query(models.Produkt).filter(models.Produkt.id == pos["produkt_id"]).first()
        if produkt:
            produkt.lagerbestand -= pos["menge"]
            if produkt.lagerbestand < 0:
                produkt.lagerbestand = 0
    
    for eintrag in warenkorb:
        db.delete(eintrag)
    
    db.commit()
    db.refresh(neue_bestellung)
    return neue_bestellung

@app.get("/bestellungen", response_model=List[schemas.BestellungResponse])
def get_bestellungen(
    current_user: models.Benutzer = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    return db.query(models.Bestellung).filter(models.Bestellung.benutzer_id == current_user.id).all()

@app.get("/bestellungen/{bestellung_id}", response_model=schemas.BestellungResponse)
def get_bestellung(
    bestellung_id: int,
    current_user: models.Benutzer = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    bestellung = db.query(models.Bestellung).filter(
        models.Bestellung.id == bestellung_id,
        models.Bestellung.benutzer_id == current_user.id
    ).first()
    
    if not bestellung:
        raise HTTPException(status_code=404, detail="Bestellung nicht gefunden")
    
    return bestellung

@app.delete("/bestellungen/{bestellung_id}")
def delete_bestellung(
    bestellung_id: int,
    current_user: models.Benutzer = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    bestellung = db.query(models.Bestellung).filter(
        models.Bestellung.id == bestellung_id,
        models.Bestellung.benutzer_id == current_user.id
    ).first()
    
    if not bestellung:
        raise HTTPException(status_code=404, detail="Bestellung nicht gefunden")
    
    db.query(models.Bestellposition).filter(
        models.Bestellposition.bestellung_id == bestellung_id
    ).delete()
    
    db.delete(bestellung)
    db.commit()
    return {"message": "Bestellung gelöscht"}

# ========================================
# TEMPORÄR: SEED-ROUTE FÜR RENDER (DEBUG)
# ========================================

@app.get("/debug-admin")
def debug_admin():
    from database import SessionLocal
    import models
    db = SessionLocal()
    benutzer = db.query(models.Benutzer).all()
    ergebnis = [{"email": b.email, "ist_admin": b.ist_admin, "erstellt_am": str(b.erstellt_am)} for b in benutzer]
    db.close()
    return ergebnis

@app.get("/fix-admin-date")
def fix_admin_date():
    from database import SessionLocal
    import models
    from datetime import datetime
    db = SessionLocal()
    benutzer = db.query(models.Benutzer).all()
    for b in benutzer:
        if b.erstellt_am is None:
            b.erstellt_am = datetime.now(datetime.UTC)
    db.commit()
    db.close()
    return {"message": "Datum repariert!"}


# Die App starten
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)