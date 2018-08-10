CC = gcc
CFLAGS = -Wall -g -std=c11

all: thermo
	gcc -shared -o ../thermostatLibrary.so ./bin/common_dht_read.o ./bin/pi_dht_read.o ./bin/pi_mmio.o

thermo: common_dht_read.o pi_dht_read.o pi_mmio.o
	ar cr ./libthermo.a ./bin/common_dht_read.o ./bin/pi_dht_read.o ./bin/pi_mmio.o

common_dht_read.o: ./source/common_dht_read.c ./source/common_dht_read.h
	gcc -c -fpic ./source/common_dht_read.c -Iinclude -o ./bin/common_dht_read.o

pi_dht_read.o: ./source/Raspberry_Pi/pi_dht_read.c ./source/Raspberry_Pi/pi_dht_read.h
	gcc -c -fpic ./source/Raspberry_Pi/pi_dht_read.c -Iinclude -o ./bin/pi_dht_read.o

pi_mmio.o: ./source/Raspberry_Pi/pi_mmio.c ./source/Raspberry_Pi/pi_mmio.h
	gcc -c -fpic ./source/Raspberry_Pi/pi_mmio.c -Iinclude -o ./bin/pi_mmio.o

clean: 
	rm ./bin/*.o ./bin/*.a