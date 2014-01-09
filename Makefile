GITROOT = `pwd`
BUILDER = builder
NODE_MODULES = node_modules

.PHONY: clean production development

#clear production
clean:
	rm -fr ./production
	@echo make: clean completed
#make production files
production:
	rm -fr ./production
	mkdir ./production

ifeq (,$($(GITROOT)/$(BUILDER)/$(NODE_MODULES)))
	cd $(GITROOT)/$(BUILDER); npm install
endif

	node builder/buildProduction.js --homedir=static.kb.dk/libcal --https=true
	@echo make: production completed

#development - install modules for the server
development:
ifeq (,$($(GITROOT)/$(NODE_MODULES)))
	npm install
	@echo make: development completed. Start a server by running ./server.js
endif

