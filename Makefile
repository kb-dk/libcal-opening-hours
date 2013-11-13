.PHONY: clean production

#clear production
clean:
	@rm -fr ./production
	@echo make: clean completed
#make production files
production:
	@rm -fr ./production
	@mkdir ./production
	@node builder/buildProduction.js --homedir=kb.zzetech.com
	@echo make: production completed
