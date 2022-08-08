from django.shortcuts import render
from django.http import HttpResponse
from rest_framework.parsers import JSONParser
from django.http.response import JsonResponse
import json, cv2, numpy
from datetime import datetime
import base64

from rest_framework.decorators import api_view
from . import Object_Detector
from . import flag
detect = Object_Detector.ObjectDetection()
flag = flag.Flag()

# Create your views here.
@api_view(['GET', 'POST'])
def Detection(request):
    if request.method == 'POST':
        print(datetime.now())
        # print(request.FILES["photo"])
        data = {'result': [], 'image': []}
        print(request.data)
        print(request.POST['clickedproject']) # Fotğrafın çekildiği proje
        flag.lastcommitted = int(request.POST['clickedproject'])
        img = cv2.imdecode(numpy.fromstring(request.FILES["photo"].read(), numpy.uint8), cv2.IMREAD_UNCHANGED)
        # img = cv2.resize(img, (720,576))
        # img = cv2.putText(img, "SERVERDAN GELEN ", (0, 570), cv2.FONT_HERSHEY_SIMPLEX, 5, (0, 255, 0), 20) 
        # img = cv2.putText(img, "GORUNTU", (0, 700), cv2.FONT_HERSHEY_SIMPLEX, 5, (0, 255, 0), 20) 
        img = detect.object_detection(img)
        # # body = json.loads(body_unicode)
        # # content = body['content']
        # cv2.imshow("Image", img)
        # cv2.waitKey(0)
        is_success, im_buf_arr = cv2.imencode(".jpg", img)
        image = "data:image/jpeg;base64," + str(base64.b64encode(im_buf_arr))[2:]
        data['image'].append(image)
        data['result'].append('OK')
        # print(data)
        # print(type(body_unicode))
        return JsonResponse(data, safe=False)
@api_view(['GET', 'POST'])
def WaitingMeshs(request):
    if request.method == 'GET':
        return JsonResponse(flag.waitingMeshs, safe=False)

@api_view(['GET', 'POST'])
def mesh(request):
    if request.method == 'POST':
        data = request.data['meshid']
        flag.waitingMeshs.append(data)
        while flag.lastcommitted != int(request.data['meshid']):
            pass    
        return JsonResponse("Dondu", safe=False)