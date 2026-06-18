# Atalhos para gerenciar o Spotle Científico em Docker.
# Uso: make <alvo>   (ex.: make up)

COMPOSE := docker compose

.DEFAULT_GOAL := help

.PHONY: help up down build rebuild restart logs ps shell clean

help: ## Lista os alvos disponíveis
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) \
		| awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-12s\033[0m %s\n", $$1, $$2}'

up: ## Sobe os serviços em background (faz build se necessário)
	$(COMPOSE) up -d --build

down: ## Para e remove os containers
	$(COMPOSE) down

build: ## Builda a imagem do app sem subir
	$(COMPOSE) build

rebuild: ## Rebuilda e reinicia só o app (após mudanças no código)
	$(COMPOSE) up -d --build app

restart: ## Reinicia todos os serviços
	$(COMPOSE) restart

logs: ## Acompanha os logs do app
	$(COMPOSE) logs -f

ps: ## Mostra o status dos containers
	$(COMPOSE) ps

shell: ## Abre um shell no container do app
	$(COMPOSE) exec app sh

clean: ## Para tudo e remove volumes
	$(COMPOSE) down -v
