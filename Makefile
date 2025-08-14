# **************************************************************************** #
#                                                                              #
#                                                         :::      ::::::::    #
#    Makefile                                           :+:      :+:    :+:    #
#                                                     +:+ +:+         +:+      #
#    By: luzog78 <luzog78@gmail.com>                +#+  +:+       +#+         #
#                                                 +#+#+#+#+#+   +#+            #
#    Created: 2025/08/14 11:18:35 by luzog78           #+#    #+#              #
#    Updated: 2025/08/14 11:22:17 by luzog78          ###   ########.fr        #
#                                                                              #
# **************************************************************************** #

NAME=Forty420
MAIN=app/main.py

PYTHON=python3
VENV=.venv

all: $(NAME)

$(NAME): $(MAIN)
	$(PYTHON) -m venv $(VENV)
	$(VENV)/bin/pip install -r requirements.txt
	$(VENV)/bin/python $(MAIN)

clean:
	rm -rf __pycache__ $(VENV)

re: clean all

.PHONY: all clean re
