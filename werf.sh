DOCKER_BUILDKIT=true \
WERF_ENV=testing \
WERF_SET_DOMAIN=env.DOMAIN=autosupply-main.iconicompany.icncd.ru \
WERF_REPO=ghcr.io/iconicompany/autosupply/autosupply \
werf $*
