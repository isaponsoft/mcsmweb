# INSTALL & SETUP

## INSTALL PACKAGES

Root user.

```sh
# for FreeBSD 
$ pkg update
$ pkg install git node npm openjdk18
```
```sh
# for Ubuntu
$ apt update
$ apt install git nodejs npm default-jre
```

## SETUP MCSMWEB


```sh
$ mkdir -p /var/games/minecraft
$ su "Your unix user name"
$ cd /var/games/minecraft
$ git clone git@github.com:isaponsoft/mcsmweb.git
$ mcsmweb/init
port number [3000] : <- enter
admin username [admin]: <- enter
admin password [admin]: <- enter
...
...
found 0 vulnerabilities
mcsmweb initial ok.
```

## RUN

```sh
$ /var/games/minecraft/mcsmweb/mcsm --config /var/games/minecraft/mcsm.ini start
# or
$ cd /var/games/minecraft
$ mcsmweb/mcsm start
```

## STOP

```sh
$ /var/games/minecraft/mcsmweb/mcsm --config /var/games/minecraft/mcsm.ini stop
# or
$ cd /var/games/minecraft
$ mcsmweb/mcsm stop
```

## UPGRADE

```sh
$ /var/games/minecraft/mcsmweb/upgrade --config /var/games/minecraft/mcsm.ini stop
# or
$ cd /var/games/minecraft
$ mcsmweb/upgrade
```

## AUTO START(FreeBSD)

root user.

```sh
$ ln -s /var/games/minecraft/mcsmweb/dist/pkg/freebsd/etc/mcsmweb /usr/local/etc/rc.d/mcsmweb
$ chmod +x /usr/local/etc/rc.d/mcsmweb
$ sysrc mcsmweb_enable=YES
$ sysrc mcsmweb_user="Your unix user name"
$ sysrc mcsmweb_group="Your unix user group"
```
