CONTAINER_NAME = devdb
DB_NAME = search
DB_PORT = 5432
DB_USER = postgres
DB_PASS = password

DB_URL = postgresql://$(DB_USER):$(DB_PASS)@$(CONTAINER_NAME):$(DB_PORT)/$(DB_NAME)?sslmode=disable

-include .env
export

default: db-up

db-up:
	docker run --rm \
		--network devdbnetwork \
		-v $(PWD)/migration:/migration \
		-e DB_URL=$(DB_URL) \
		migrate/migrate -path=/migration -database $(DB_URL) up

db-down:
	docker run --rm \
		--network devdbnetwork \
		-v $(PWD)/migration:/migration \
		-e DB_URL=$(DB_URL) \
		migrate/migrate -path=/migration -database $(DB_URL) down 1

db-create:
	docker run --rm \
		--network devdbnetwork \
		-e PGPASSWORD=$(DB_PASS) \
		postgres:17 \
		createdb -h $(CONTAINER_NAME) -p $(DB_PORT) -U $(DB_USER) --no-password $(DB_NAME)

db-drop:
	docker run --rm \
		--network devdbnetwork \
		-e PGPASSWORD=$(DB_PASS) \
		postgres:17 \
		dropdb -h $(CONTAINER_NAME) -p $(DB_PORT) -U $(DB_USER) --no-password $(DB_NAME)

db-reset: db-drop db-create db-up

db-docker:
	-docker network create devdbnetwork
	docker run --rm --network devdbnetwork --name $(CONTAINER_NAME) -e POSTGRES_PASSWORD=$(DB_PASS) -e POSTGRES_USER=$(DB_USER) -p $(DB_PORT):$(DB_PORT) -d postgres:17.2


db-reset-dev: 
	@[ -n "${DEV_DB_URL}" ] || { echo "set DEV_DB_URL"; exit 1; }
	docker run --rm postgres:17 psql $(DEV_DB_URL)/postgres -c "DO \$$\$$ BEGIN PERFORM pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '$(DB_NAME)'; END \$$\$$;"
	-docker run --rm postgres:17 psql $(DEV_DB_URL)/postgres -c "DROP DATABASE $(DB_NAME)"
	docker run --rm postgres:17 psql $(DEV_DB_URL)/postgres -c "CREATE DATABASE $(DB_NAME)"
	docker run --rm \
			-v $(PWD)/migration:/migration \
			migrate/migrate -path=/migration -database $(DEV_DB_URL)/$(DB_NAME)?sslmode=disable up

# elasticsearch
es-docker:
	docker run --rm --network devdbnetwork --name es -p 9200:9200 \
		-e "discovery.type=single-node" \
		-e "ES_JAVA_OPTS=-Xms512m -Xmx512m" \
		-e "ELASTIC_PASSWORD=changeme" \
		-d elasticsearch:9.2.1
