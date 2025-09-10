# base
FROM lockhost-runtime

# apk example
COPY apk/repositories.serve /etc/apk/repositories
RUN apk add --no-cache fortune=0.1-r3

# js packages
WORKDIR /app
COPY node/package.json .
COPY node/package-lock.json .
RUN npm install

# js sources
COPY node node
RUN mv node/* .
RUN chmod +x app.sh

# rm trash
RUN rm -rf /root/.cache
RUN rm -rf /root/nvm/.git
RUN rm -rf /root/.nvm/.cache
RUN rm -f /root/.nvm/alias/lts/*
RUN rm -rf /root/.npm
RUN rm -f /lib/apk/db/scripts.tar
RUN rm -rf /var/cache

# nitro needs this
ARG PROD=true
ENV PROD=${PROD}
RUN if [ "$PROD" = "true" ]; then \
      chmod -R ug+w,o-rw /runtime /app && \
      chmod ug+w,o-rw /etc/apk/repositories && \
      find / -exec touch -t 197001010000.00 {} + || true && \
      find / -exec touch -h -t 197001010000.00 {} + || true; \
    fi

# nitro needs this
RUN cd /app

ENTRYPOINT ["/app/app.sh"]
