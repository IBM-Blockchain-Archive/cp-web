#!/bin/bash
haproxy -f /etc/haproxy/haproxy.cfg -D &> /haproxy.log
node app
