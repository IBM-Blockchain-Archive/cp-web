FROM    node:5

WORKDIR /
RUN apt-get install haproxy -y
COPY haproxy.cfg /etc/haproxy/haproxy.cfg

RUN mkdir -p /opt/certs
COPY blockchain.ibm.com.pem /opt/certs/blockchain.ibm.com.pem

RUN mkdir -p /cp-demo
COPY . /cp-demoi/
RUN cd /cp-demo ; 
npm install --production
WORKDIR /cp-demo

CMD ["start.sh"]

