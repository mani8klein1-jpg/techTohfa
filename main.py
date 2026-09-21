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
    allow_origins=["*"],
    allow_credentials=False,
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
    
    # Prüfen, ob E-Mail schon existiert
    existiert = db.query(models.Benutzer).filter(models.Benutzer.email == benutzer.email).first()
    if existiert:
        raise HTTPException(status_code=400, detail="E-Mail bereits registriert")
    
    # Passwort verschlüsseln
    passwort_hash = auth.hash_passwort(benutzer.passwort)
    
    # Benutzer erstellen
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
    
    # Benutzer suchen
    benutzer = db.query(models.Benutzer).filter(models.Benutzer.email == form_data.username).first()
    
    if not benutzer:
        raise HTTPException(status_code=401, detail="E-Mail oder Passwort falsch")
    
    # Passwort prüfen
    if not auth.verify_passwort(form_data.password, benutzer.passwort_hash):
        raise HTTPException(status_code=401, detail="E-Mail oder Passwort falsch")
    
    # Token erstellen
    access_token = auth.create_access_token(
        data={"sub": benutzer.email}
    )
    
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
    # ↓ HIER kommt die Prüfung hin
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
    """Produkt aktualisieren (nur Admin)"""
    # ↓ HIER kommt die Prüfung hin
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
    """Produkt löschen (nur Admin)"""
    # ↓ HIER kommt die Prüfung hin
    if not current_user.ist_admin:
        raise HTTPException(status_code=403, detail="Nur Admins dürfen Produkte löschen")
    
    db_produkt = db.query(models.Produkt).filter(models.Produkt.id == produkt_id).first()
    
    if not db_produkt:
        raise HTTPException(status_code=404, detail="Produkt nicht gefunden")
    
    # Erst Warenkorb-Einträge löschen
    db.query(models.Warenkorb).filter(models.Warenkorb.produkt_id == produkt_id).delete()
    
    # Dann Bestellpositionen löschen
    db.query(models.Bestellposition).filter(models.Bestellposition.produkt_id == produkt_id).delete()
    
    # Dann Produkt löschen
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
    """Produkt in den Warenkorb legen"""
    
    # Prüfen, ob Produkt existiert
    produkt = db.query(models.Produkt).filter(models.Produkt.id == eintrag.produkt_id).first()
    if not produkt:
        raise HTTPException(status_code=404, detail="Produkt nicht gefunden")
    
    # Prüfen, ob Produkt schon im Warenkorb ist
    existiert = db.query(models.Warenkorb).filter(
        models.Warenkorb.benutzer_id == current_user.id,
        models.Warenkorb.produkt_id == eintrag.produkt_id
    ).first()
    
    if existiert:
        # Menge erhöhen
        existiert.menge += eintrag.menge
        db.commit()
        db.refresh(existiert)
        return existiert
    else:
        # Neuen Eintrag erstellen
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
    """Warenkorb des aktuellen Benutzers anzeigen"""
    return db.query(models.Warenkorb).filter(models.Warenkorb.benutzer_id == current_user.id).all()

@app.put("/warenkorb/{eintrag_id}")
def update_warenkorb(
    eintrag_id: int,
    daten: schemas.WarenkorbUpdate,
    current_user: models.Benutzer = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Menge eines Warenkorb-Eintrags ändern"""
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
    """Produkt aus dem Warenkorb entfernen"""
    eintrag = db.query(models.Warenkorb).filter(
        models.Warenkorb.id == eintrag_id,
        models.Warenkorb.benutzer_id == current_user.id
    ).first()
    
    if not eintrag:
        raise HTTPException(status_code=404, detail="Eintrag nicht gefunden")
    
    db.delete(eintrag)
    db.commit()
    return {"message": "Produkt aus dem Warenkorb entfernt"}


@app.delete("/warenkorb/{eintrag_id}")
def delete_warenkorb(

    eintrag_id: int,
    current_user: models.Benutzer = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Produkt aus dem Warenkorb entfernen"""
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
    """Bestellung aufgeben (Warenkorb wird zur Bestellung)"""
    
    # Warenkorb des Benutzers holen
    warenkorb = db.query(models.Warenkorb).filter(
        models.Warenkorb.benutzer_id == current_user.id
    ).all()
    
    if not warenkorb:
        raise HTTPException(status_code=400, detail="Warenkorb ist leer")
    
    # Prüfen, ob genug auf Lager ist
    for eintrag in warenkorb:
        produkt = db.query(models.Produkt).filter(models.Produkt.id == eintrag.produkt_id).first()
        if not produkt:
            raise HTTPException(status_code=404, detail=f"Produkt {eintrag.produkt_id} nicht gefunden")
        if produkt.lagerbestand < eintrag.menge:
            raise HTTPException(
                status_code=400,
                detail=f"Nicht genug auf Lager: {produkt.name} (nur {produkt.lagerbestand} verfügbar)"
            )
    
    # Gesamtpreis berechnen
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
    
    # Bestellung erstellen
    neue_bestellung = models.Bestellung(
        benutzer_id=current_user.id,
        gesamtpreis=round(gesamtpreis, 2),
        status="offen"
    )
    db.add(neue_bestellung)
    db.commit()
    db.refresh(neue_bestellung)
    
    # Bestellpositionen erstellen + Lagerbestand reduzieren
    for pos in positionen:
        # Bestellposition speichern
        neue_position = models.Bestellposition(
            bestellung_id=neue_bestellung.id,
            produkt_id=pos["produkt_id"],
            menge=pos["menge"],
            preis=pos["preis"]
        )
        db.add(neue_position)
        
        # Lagerbestand reduzieren
        produkt = db.query(models.Produkt).filter(models.Produkt.id == pos["produkt_id"]).first()
        if produkt:
            produkt.lagerbestand -= pos["menge"]
            if produkt.lagerbestand < 0:
                produkt.lagerbestand = 0
    
    # Warenkorb leeren ← AUS DER SCHLEIFE RAUS!
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
    """Alle Bestellungen des aktuellen Benutzers anzeigen"""
    return db.query(models.Bestellung).filter(models.Bestellung.benutzer_id == current_user.id).all()

@app.get("/bestellungen/{bestellung_id}", response_model=schemas.BestellungResponse)
def get_bestellung(
    bestellung_id: int,
    current_user: models.Benutzer = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Eine einzelne Bestellung anzeigen"""
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
    """Bestellung löschen (inkl. Positionen)"""
    bestellung = db.query(models.Bestellung).filter(
        models.Bestellung.id == bestellung_id,
        models.Bestellung.benutzer_id == current_user.id
    ).first()
    
    if not bestellung:
        raise HTTPException(status_code=404, detail="Bestellung nicht gefunden")
    
    # Erst Positionen löschen (Fremdschlüssel)
    db.query(models.Bestellposition).filter(
        models.Bestellposition.bestellung_id == bestellung_id
    ).delete()
    
    # Dann Bestellung löschen
    db.delete(bestellung)
    db.commit()
    
    return {"message": "Bestellung gelöscht"}


# Die App starten
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)