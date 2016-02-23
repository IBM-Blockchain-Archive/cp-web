FROM    node:5

RUN mkdir -p /r3demo
COPY . /r3demo/
RUN cd /r3demo ; npm install --production
WORKDIR /r3demo
RUN export VCAP_SERVICES=$(cat VCAP_SERVICES.json)
EXPOSE 3000

CMD ["node app"]

