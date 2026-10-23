# ========================================
# TECHSTORE API - HAUPTDATEI
# ========================================

import os
import requests
from fastapi import BackgroundTasks
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


def sende_bestaetigungs_email(empfaenger_email: str, kunden_name: str, bestellnummer: int, gesamtpreis: float, positionen: list):
    """Sendet eine gestaltete HTML-Bestätigung über die Brevo API."""
    api_key = os.getenv("BREVO_API_KEY")
    sender_email = os.getenv("SMTP_SENDER")

    if not api_key or not sender_email:
        print("Brevo-Konfiguration fehlt – E-Mail wird nicht gesendet.")
        return

    # Produktliste als HTML-Tabelle aufbauen
    positionen_html = ""
    for pos in positionen:
        positionen_html += f"""
        <tr>
            <td style="padding: 10px; border-bottom: 1px solid #eee;">{pos['name']}</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">{pos['menge']}</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">{pos['preis'] * pos['menge']:.2f} €</td>
        </tr>
        """

    body = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            body {{ font-family: 'Roboto Condensed', Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 0; }}
            .container {{ max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }}
            .header {{ background-color: #1a1a1a; padding: 20px; text-align: center; }}
            .header h1 {{ color: #ffffff; margin: 0; font-size: 24px; letter-spacing: 2px; }}
            .header h1 span {{ color: #e94560; }}
            .content {{ padding: 30px; color: #333333; }}
            .content h2 {{ font-size: 20px; margin-bottom: 10px; }}
            .content p {{ font-size: 15px; line-height: 1.6; margin-bottom: 15px; }}
            .order-table {{ width: 100%; border-collapse: collapse; margin: 20px 0; }}
            .order-table th {{ background: #f9f9f9; padding: 10px; text-align: left; font-size: 14px; border-bottom: 2px solid #ddd; }}
            .order-table td {{ font-size: 14px; }}
            .total {{ text-align: right; font-size: 18px; font-weight: bold; color: #e94560; margin-top: 20px; }}
            .footer {{ background-color: #f9f9f9; padding: 20px; text-align: center; font-size: 12px; color: #888888; }}
            .test-hint {{ background-color: #fff3cd; color: #856404; padding: 15px; border-radius: 4px; margin-bottom: 20px; font-size: 14px; border-left: 4px solid #ffc107; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>TECH<span>TOHFA</span></h1>
            </div>
            <div class="content">
                <h2>Hallo {kunden_name},</h2>
                <p>vielen Dank für deine Bestellung bei TechTOHFA! Wir haben deine Bestellung erhalten und bearbeiten sie umgehend.</p>
                
                <div class="test-hint">
                    ⚠️ <strong>WICHTIG:</strong> Dies ist eine TEST-BESTELLUNG! Es handelt sich um ein Portfolio-Projekt. Es wurde kein echter Kauf getätigt und es wird kein Geld abgebucht.
                </div>

                <h3>Deine Bestellung (#{bestellnummer})</h3>
                <table class="order-table">
                    <thead>
                        <tr>
                            <th>Produkt</th>
                            <th style="text-align: center;">Menge</th>
                            <th style="text-align: right;">Preis</th>
                        </tr>
                    </thead>
                    <tbody>
                        {positionen_html}
                    </tbody>
                </table>
                <div class="total">Gesamt: {gesamtpreis:.2f} €</div>
                
                <p style="margin-top: 30px;">Wir wünschen dir viel Freude mit deiner Bestellung!</p>
                <p>Viele Grüße,<br>Dein TechTOHFA-Team</p>
            </div>
            <div class="footer">
                &copy; 2026 TechTOHFA - Alle Rechte vorbehalten
            </div>
        </div>
    </body>
    </html>
    """

    url = "https://api.brevo.com/v3/smtp/email"
    headers = {
        "accept": "application/json",
        "api-key": api_key,
        "content-type": "application/json"
    }
    payload = {
        "sender": {"email": sender_email, "name": "TechTOHFA"},
        "to": [{"email": empfaenger_email}],
        "subject": f"Deine Bestellung bei TechTOHFA (#{bestellnummer})",
        "htmlContent": body  # WICHTIG: htmlContent statt textContent!
    }

    try:
        response = requests.post(url, headers=headers, json=payload)
        print(f"Brevo-Status: {response.status_code} – {response.text}")
    except Exception as e:
        print(f"Fehler beim E-Mail-Versand: {e}")



# Die FastAPI-App erstellen
app = FastAPI(title="TechStore API")

# CORS erlauben
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],              # Erlaubt ALLE Origins
    allow_credentials=False,          # WICHTIG: Muss False sein bei "*"
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
    background_tasks: BackgroundTasks,
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
        # Produktnamen für die E-Mail sammeln
    positionen_fuer_email = []
    for pos in positionen:
        produkt = db.query(models.Produkt).filter(models.Produkt.id == pos["produkt_id"]).first()
        positionen_fuer_email.append({
            "name": produkt.name,
            "menge": pos["menge"],
            "preis": pos["preis"]
        })

    background_tasks.add_task(
        sende_bestaetigungs_email,
        current_user.email,
        current_user.name,
        neue_bestellung.id,
        neue_bestellung.gesamtpreis,
        positionen_fuer_email
    )
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
 
 


# Die App starten
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)