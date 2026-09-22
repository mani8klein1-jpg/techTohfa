# ========================================
# TECHSTORE BACKEND
# ========================================

# Python 3.12 als Basis
FROM python:3.12-slim

# Arbeitsverzeichnis
WORKDIR /app

# System-Pakete (für bcrypt)
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Requirements zuerst (für besseres Caching)
COPY requirements.txt .

# Python-Pakete installieren
RUN pip install --no-cache-dir -r requirements.txt

# Code kopieren
COPY . .

# Port freigeben
EXPOSE 8000

# Server starten
CMD ["python", "main.py"]