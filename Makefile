# **************************************************************************** #
#                                                                              #
#                                                         :::      ::::::::    #
#    Makefile                                           :+:      :+:    :+:    #
#                                                     +:+ +:+         +:+      #
#    By: luzog78 <luzog78@gmail.com>                +#+  +:+       +#+         #
#                                                 +#+#+#+#+#+   +#+            #
#    Created: 2025/08/14 11:18:35 by luzog78           #+#    #+#              #
#    Updated: 2025/08/31 01:43:18 by luzog78          ###   ########.fr        #
#                                                                              #
# **************************************************************************** #

NAME		= Forty420
APP_DIR		= app/
SERVER_DIR	= $(APP_DIR)server/
CLIENT_DIR	= $(APP_DIR)client/

NPM			= npm

ENV_PROD	= .env
ENV_DEV		= .dev.env

LOGS_DIR	= logs/


# ******************************************************************************


APP_DIR		:= $(abspath $(APP_DIR))/
SERVER_DIR	:= $(abspath $(SERVER_DIR))/
CLIENT_DIR	:= $(abspath $(CLIENT_DIR))/
LOGS_DIR	:= $(abspath $(LOGS_DIR))/

dev_mode	= 0
npm_args	= start


.ONESHELL:


all: $(NAME)


dev:
	$(eval dev_mode = 1)
	$(eval npm_args = run dev)


define .env
	@if [ "$(dev_mode)" -eq "1" ]; then \
		echo "--> Using development environment variables from '$(ENV_DEV)'"; \
		export $$(grep -v '^#' $(ENV_DEV) | sed -e 's/^\([^=\t\r ]\+\)\s\+=\s\+/\1=/g' | xargs); \
	else \
		echo "--> Using production environment variables from '$(ENV_PROD)'"; \
		export $$(grep -v '^#' $(ENV_PROD) | sed -e 's/^\([^=\t\r ]\+\)\s\+=\s\+/\1=/g' | xargs); \
	fi
endef


define exec
	@echo '$$>$(1)'
	@$(1)
endef


client-install: $(CLIENT_DIR)/package.json
	$(call exec, cd $(CLIENT_DIR))
	$(call exec, $(NPM) install)


client-build: client-install
	$(call .env)
	$(call exec, cd $(CLIENT_DIR))
	$(call exec, $(NPM) run build)


client:
	$(call .env)
	$(call exec, cd $(CLIENT_DIR))
	$(call exec, export SERVER_PORT=$${PORT})
	$(call exec, export PORT=$${CLIENT_PORT})
	$(call exec, echo "Starting client on port $${PORT} and connecting to server on port $${SERVER_PORT}" )
	$(call exec, $(NPM) run start)


client-clean:
	$(call exec, cd $(CLIENT_DIR))
	$(call exec, rm -rf node_modules)
	$(call exec, rm -f package-lock.json)
	$(call exec, rm -rf build)


server-install: $(SERVER_DIR)/package.json
	$(call exec, cd $(SERVER_DIR))
	$(call exec, $(NPM) install)


server:
	$(call .env)
	$(call exec, cd $(SERVER_DIR))
	$(call exec, $(NPM) $(npm_args))


server-d:
	$(call .env)
	$(call exec, cd $(SERVER_DIR))
	$(call exec, mkdir -p $(LOGS_DIR))
	$(call exec, nohup $(NPM) $(npm_args) > $(LOGS_DIR)server.log 2>&1 &)


server-stop:
	$(call exec, pkill -f "node .*index.js" && echo "Server stopped." || echo "No server process found.")


server-clean:
	$(call exec, cd $(SERVER_DIR))
	$(call exec, rm -rf node_modules)
	$(call exec, rm -f package-lock.json)


install: server-install client-install


start: client-build server


start-d: client-build server-d


clean: server-clean client-clean


fclean: clean
	$(call exec, rm -rf $(LOGS_DIR))


$(NAME): install start


d: install start-d


stop: server-stop


re: stop clean all


help:
	@echo "Makefile commands:"
	@echo "  all            : Do \$$(NAME) ('$(NAME)')"
	@echo "  dev            : Add dev mode flag (use with other commands)"
	@echo
	@echo "  client-install : Install client dependencies"
	@echo "  client-build   : Build the client application"
	@echo "  client         : Start the client in development server (does not install nor build client)"
	@echo "  client-clean   : Remove client dependencies and build files"
	@echo
	@echo "  server-install : Install server dependencies"
	@echo "  server         : Start the server"
	@echo "  server-d       : Start the server in detached mode"
	@echo "  server-stop    : Stop the server"
	@echo "  server-clean   : Remove server dependencies"
	@echo
	@echo "  install        : Install both client and server dependencies (client-install & server-install)"
	@echo "  start          : Start both client and server (client-build & server)"
	@echo "  start-d        : Start both client and server in detached mode (client-build & server-d)"
	@echo "  clean          : Clean both client and server (client-clean & server-clean)"
	@echo "  fclean         : Full clean including logs"
	@echo
	@echo "  \$$(NAME)        : Full install and start (install & start)"
	@echo "  d              : Full install and start in detached mode (install & start-d)"
	@echo "  stop           : Stop the server (server-stop)"
	@echo "  re             : Restart the entire application (stop & clean & all)"


.PHONY: all dev client-install client-build client client-clean server-install server server-d server-stop server-clean install start start-d clean fclean d stop re help
