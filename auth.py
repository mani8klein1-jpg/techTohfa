# ========================================
# AUTHENTIFIZIERUNG
# ========================================
# Diese Datei kümmert sich um:
# - Passwort-Hashing (Passwörter verschlüsseln)
# - JWT-Token erstellen und prüfen
# - Benutzer-Authentifizierung

from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from database import SessionLocal, get_db
import models
import os
import bcrypt
from dotenv import load_dotenv
from pathlib import Path
import os

# .env-Datei im gleichen Ordner wie auth.py
env_path = Path(__file__).parent / ".env"
load_dotenv(dotenv_path=env_path)

# ========================================
# KONFIGURATION
# ========================================

SECRET_KEY = os.getenv("SECRET_KEY", "test-secret-key-for-ci")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 30))

# ========================================
# PASSWORT-HASHING
# ========================================
# bcrypt verschlüsselt Passwörter, damit sie
# nicht im Klartext in der Datenbank stehen.

def hash_passwort(passwort: str) -> str:
    """Verschlüsselt ein Passwort mit bcrypt"""
    # Passwort in Bytes umwandeln
    passwort_bytes = passwort.encode('utf-8')
    # bcrypt generiert einen Salt und hasht das Passwort
    hash_bytes = bcrypt.hashpw(passwort_bytes, bcrypt.gensalt())
    # Hash zurück als String geben
    return hash_bytes.decode('utf-8')

def verify_passwort(klartext: str, hash: str) -> bool:
    """Prüft, ob ein Passwort mit dem Hash übereinstimmt"""
    try:
        # Passwort und Hash in Bytes umwandeln
        klartext_bytes = klartext.encode('utf-8')
        hash_bytes = hash.encode('utf-8')
        # bcrypt prüft, ob sie übereinstimmen
        return bcrypt.checkpw(klartext_bytes, hash_bytes)
    except Exception:
        return False

# ========================================
# JWT-TOKEN - JWT steht für JSON Web Token.
# ========================================
# JWT ist wie ein "Ausweis" für den Benutzer.

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login", auto_error=False)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Erstellt einen JWT-Token"""
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    """Prüft den Token und gibt den Benutzer zurück"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Token ungültig",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    if token is None:
        raise credentials_exception
    
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    # Datenbank-Session verwenden (aus get_db)
    benutzer = db.query(models.Benutzer).filter(models.Benutzer.email == email).first()
    
    if benutzer is None:
        raise credentials_exception
    
    return benutzer