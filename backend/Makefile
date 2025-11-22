CONTAINER_NAME = devdb
DB_NAME = search
DB_PORT = 5432
DB_USER = postgres
DB_PASS = password

DB_URL = postgresql://$(DB_USER):$(DB_PASS)@$(CONTAINER_NAME):$(DB_PORT)/$(DB_NAME)?sslmode=disable

default: up

fill_database:
	cat fill_dev_database.sql | docker exec -i $(CONTAINER_NAME) psql -U $(DB_USER) -d $(DB_NAME)

up:
	docker run --rm \
		--network devdbnetwork \
		-v $(PWD)/migration:/migration \
		-e DB_URL=$(DB_URL) \
		migrate/migrate -path=/migration -database $(DB_URL) up

down:
	docker run --rm \
		--network devdbnetwork \
		-v $(PWD)/migration:/migration \
		-e DB_URL=$(DB_URL) \
		migrate/migrate -path=/migration -database $(DB_URL) down 1

create:
	docker run --rm \
		--network devdbnetwork \
		-e PGPASSWORD=$(DB_PASS) \
		postgres:17 \
		createdb -h $(CONTAINER_NAME) -p $(DB_PORT) -U $(DB_USER) --no-password $(DB_NAME)

drop:
	docker run --rm \
		--network devdbnetwork \
		-e PGPASSWORD=$(DB_PASS) \
		postgres:17 \
		dropdb -h $(CONTAINER_NAME) -p $(DB_PORT) -U $(DB_USER) --no-password $(DB_NAME)

reset: drop create up fill_database

docker:
	-docker network create devdbnetwork
	docker run --rm --network devdbnetwork --name $(CONTAINER_NAME) -e POSTGRES_PASSWORD=$(DB_PASS) -e POSTGRES_USER=$(DB_USER) -p $(DB_PORT):$(DB_PORT) -d postgres:17.2
