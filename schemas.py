# ========================================
# PYDANTIC-SCHEMAS
# ========================================
# Diese Dateien definieren, wie die Daten
# zwischen Frontend und Backend aussehen.
# Sie sind wie "Formulare", die ausgefüllt werden.

from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

# ========================================
# KATEGORIEN
# ========================================

class KategorieBase(BaseModel):
    """Basis-Felder für eine Kategorie"""
    name: str
    beschreibung: Optional[str] = None

class KategorieCreate(KategorieBase):
    """Zum Erstellen einer Kategorie"""
    pass

class KategorieResponse(KategorieBase):
    """Zum Anzeigen einer Kategorie"""
    id: int

    class Config:
        from_attributes = True

# ========================================
# PRODUKTE
# ========================================

class ProduktBase(BaseModel):
    """Basis-Felder für ein Produkt"""
    name: str
    beschreibung: Optional[str] = None
    preis: float
    lagerbestand: int = 0
    bild_url: Optional[str] = None
    kategorie_id: Optional[int] = None

class ProduktCreate(ProduktBase):
    """Zum Erstellen eines Produkts"""
    pass

class ProduktResponse(ProduktBase):
    """Zum Anzeigen eines Produkts"""
    id: int

    class Config:
        from_attributes = True

# ========================================
# BENUTZER
# ========================================

class BenutzerBase(BaseModel):
    """Basis-Felder für einen Benutzer"""
    name: str
    email: str

class BenutzerCreate(BenutzerBase):
    """Zum Erstellen eines Benutzers"""
    passwort: str

class BenutzerResponse(BenutzerBase):
    """Zum Anzeigen eines Benutzers"""
    id: int
    erstellt_am: datetime
    ist_admin: bool = False   # ← NEU

    class Config:
        from_attributes = True        
        
# ========================================
# TOKEN
# ========================================

class Token(BaseModel):
    """Der JWT-Token, den der Benutzer nach dem Login bekommt"""
    access_token: str
    token_type: str

class TokenData(BaseModel):
    """Die Daten, die im Token gespeichert sind"""
    email: Optional[str] = None


# ========================================
# WARENKORB
# ========================================

class WarenkorbBase(BaseModel):
    """Basis-Felder für einen Warenkorb-Eintrag"""
    produkt_id: int
    menge: int = 1



class WarenkorbCreate(WarenkorbBase):
    """Zum Erstellen eines Warenkorb-Eintrags"""
    pass

class WarenkorbUpdate(BaseModel):
    """Zum Ändern der Menge eines Warenkorb-Eintrags"""
    menge: int

class WarenkorbResponse(WarenkorbBase):
    """Zum Anzeigen eines Warenkorb-Eintrags"""
    id: int
    benutzer_id: int

    class Config:
        from_attributes = True

# ========================================
# BESTELLUNGEN
# ========================================

class BestellpositionResponse(BaseModel):
    """Zum Anzeigen einer Bestellposition"""
    id: int
    produkt_id: int
    menge: int
    preis: float

    class Config:
        from_attributes = True

class BestellungResponse(BaseModel):
    """Zum Anzeigen einer Bestellung"""
    id: int
    benutzer_id: int
    gesamtpreis: float
    status: str
    erstellt_am: datetime
    erstellt_am: datetime
    positionen: List[BestellpositionResponse] = []

    class Config:
        from_attributes = True