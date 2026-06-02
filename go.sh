docker compose down -v
docker builder prune -f
docker compose build --no-cache
docker compose up -d
docker compose logs -f app

