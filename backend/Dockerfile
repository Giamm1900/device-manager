FROM python:3.12-slim
WORKDIR /app

COPY pyproject.toml .
RUN mkdir app && touch app/__init__.py && \
    pip install --no-cache-dir --root-user-action=ignore hatchling && \
    pip install --no-cache-dir --root-user-action=ignore .

COPY app/ ./app/
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
