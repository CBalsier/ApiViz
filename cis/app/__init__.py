# -*- encoding: utf-8 -*-


"""
front app du Carrefour des Innovations Sociales : 
-------------------------------------------------
version : 0.1
-------------------------------------------------
- framework back 	: flask
- landing page 		: pure html + Bulma
- logged pages 		: Vue.js ?

"""


print
print "__init__ / global imports for functions"


### + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + ###
### GLOBAL IMPORTS  #########################################################################
### + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + ###

import	time, datetime
from	datetime import timedelta
import	json
from 	pprint import pprint, pformat
from	bson import json_util
from	bson.objectid import ObjectId
from	bson.json_util import dumps
import	itertools
import	unidecode
import	re
from	functools import wraps
# from   threading import Thread
import	urllib2
import	uuid


### + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + ###
### SET LOGGER ##############################################################################
### + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + ###

from backend.config_logging import log_cis
log_cis.debug('TESTING LOGGER')

### + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + ###
### FLASK IMPORTS ###########################################################################
### + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + ###

from    flask import Flask, g
from    flask import jsonify, flash, render_template, url_for, make_response, request, session, redirect
import  os
from    os import environ
import  socket

host_IP = socket.gethostbyname( socket.gethostname() )
log_cis.info( "host IP : %s " , host_IP )


### + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + ###
### CRYPTO IMPORT ###########################################################################
### + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + ###

import  bcrypt
import	jwt



### + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + ###
### SCHEDULER IMPORT  #######################################################################
### + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + ###

### no need for now 
# from flask_apscheduler import APScheduler
# from flask_apscheduler.auth import HTTPBasicAuth



### + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + ###
### MONGO DB IMPORTS ########################################################################
### + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + ###

from	flask_pymongo import PyMongo ### flask_pymongo instead of flask.ext.pymongo
# import 	pymongo
# from 	pymongo import MongoClient
# from 	pymongo import UpdateOne



### + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + ###
### SETTINGS AT MAIN LEVEL ###################################################################
### + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + ###

### create Flask app 
app			= Flask( __name__ )

### set environment and app variables
log_cis.debug("configuring app's env vars...\n")
from .backend.config_env import * 
configure_app(app)

if config_name == "default" or config_name == "production" :

	log_cis.info('config_name : %s', config_name )
	print

	log_cis.debug(	"ENVIRONMENT VARIABLES / to understand what the fuck is goin on ... : \n %s", 
					pformat({ k : v for k,v in  os.environ.iteritems() }) )
	print

	log_cis.debug(	"APP.CONFIG / to understand what the fucking fuck is goin on ... : \n %s", 
					pformat({ k : v for k,v in  app.config.iteritems() }) )
	print

print



### + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + ###
### LOGIN MANAGER ###########################################################################
### + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + ###

from  flask_login import LoginManager

### create login manager
login_manager = LoginManager()
login_manager.init_app(app)

### TO DO : follow tuto login manager


### + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + ###
### EMAILING IMPORTS ########################################################################
### + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + ###

from	flask_mail import Mail, Message

### set flask-email after config
mail 	= Mail(app)


### + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + ###
### INITIATE MONGO DB AND IMPORT MAIN CLASSES ###############################################
### + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + ###

# settings classes : global variable for app
from settings import *

# forms classes :
from forms import * # LoginForm, UserRegisterForm, UserUpdateForm, UserHistoryAloesForm, RequestCabForm

# db classes and functions
from api import *



### + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + ###
### IMPORT VIEWS ############################################################################
### + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + + ###

from . import views

print
log_cis.debug("all imports are finished...\n")