FROM python:3.12-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    netcat-traditional \
    && rm -rf /var/lib/apt/lists/*

# Create dedicated non-root application user
RUN addgroup --system app && adduser --system --ingroup app app

# Install python dependencies
COPY requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt gunicorn

# Copy project files and ensure non-root ownership
COPY . /app/
RUN mkdir -p /app/staticfiles /app/media && chown -R app:app /app

# Make entrypoint executable
RUN chmod +x /app/entrypoint.sh 2>/dev/null || true

USER app

ENV WEB_CONCURRENCY=3 \
    GUNICORN_THREADS=2

CMD ["sh", "-c", "gunicorn config.wsgi:application --bind 0.0.0.0:8000 --workers ${WEB_CONCURRENCY:-3} --threads ${GUNICORN_THREADS:-2}"]
