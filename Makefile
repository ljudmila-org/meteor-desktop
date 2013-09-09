help:
	@echo 'Type "make some-target" to make something useful.'
	@echo "Targets:"
	@grep -e '^[^: ]*:$$' Makefile | sed -e 's/^/\t/'
	@echo "Note: You might want to source etc/env.sh"

all: run

update:
	cd src ; meteor update

run:
	cd src ; mrt run

git-update:
	git fetch upstream
	git merge upstream/master
