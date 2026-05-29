FROM python:3.12-slim
WORKDIR /backend

# 1. Copia IMMEDIATAMENTE tutto il codice nel container
COPY . .

# 2. Crea il file init se manca, installa hatchling e poi il progetto
RUN touch app/__init__.py && \
    pip install --no-cache-dir --root-user-action=ignore hatchling && \
    pip install --no-cache-dir --root-user-action=ignore .

EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]