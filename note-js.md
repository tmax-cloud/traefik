#### build console ui 
```shell
nvm use v14.15.0
./script/build-frontend.sh
```
#### build traefik binary 
```shell
./script/make.sh binary
```

#### run traefik with console ui as port number: 9090
```shell
./dist/traefik --configfile traefik.sample.yml
```