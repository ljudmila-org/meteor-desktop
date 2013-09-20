help:
	@echo 'Type "make some-target" to make something useful.'
	@echo "Targets:"
	@grep -e '^[^: ]*:$$' Makefile | sed -e 's/^/\t/'
	@echo "Note: You might want to source etc/env.sh"

all: bundle deb

bundle: update
	cd src ; meteor bundle bundle.tar.gz ; mv bundle.tar.gz ..

update:
	cd src ; mrt update

run:
	cd src ; mrt run

install-meteor:
	curl https://install.meteor.com | /bin/sh

git-update:
	git fetch upstream
	git merge upstream/master

deb:
	cd debian/usr/share ; tar zxf ../../../bundle.tar.gz ; mv bundle meteor-desktop
	fakeroot dpkg-deb --build debian
	mv debian.deb  meteor-desktop.deb

clean:
	-rm bundle.tar.gz
	-rm -rf build bundle
	-rm -rf debian/usr/share/meteor-desktop
