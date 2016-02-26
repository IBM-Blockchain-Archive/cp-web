FROM    node:5

WORKDIR /
RUN apt-get install haproxy -y
COPY haproxy.cfg /etc/haproxy/haproxy.cfg

RUN mkdir -p /cp-demo
COPY . /cp-demo/
RUN cd /cp-demo ; 
npm install --production
WORKDIR /cp-demo

CMD ["start.sh"]

