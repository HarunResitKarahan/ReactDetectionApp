import os
import cv2
import numpy as np
import tensorflow as tf
import sys
# from numpy import asarray, isin
# from .log_functions import log_for_plc_bit_change


# This is needed since the notebook is stored in the object_detection folder.
sys.path.append("..")

from tensorflow import ConfigProto
from tensorflow import InteractiveSession

from .utils import label_map_util
from .utils import visualization_utils as vis_util

# MODEL_NAME_MASKRCNN = 'mask_rcnn_inception_v2_coco_2018_01_28'
# MODEL_NAME_FASTRCNN = 'faster_rcnn_inception_v2_coco_2018_01_28'
# MODEL_NAME_SSD = 'ssd_inception_v2_coco_2018_01_28' 
# LABEL_MAP = 'mscoco_label_map.pbtxt'
NUM_CLASSES = 90

class ObjectDetection(object):
    def __init__(self):
        self.labels = []
        with open(os.path.join(os.getcwd(),'Detection', 'classes.txt'), 'r') as f:
            for index,item in enumerate(f.readlines()):
                self.labels.append(item)
        self.config = ConfigProto()
        self.config.gpu_options.allow_growth = True
        self.config.gpu_options.per_process_gpu_memory_fraction = 0.4
        self.session = InteractiveSession(config=self.config)
        self.MODEL_NAME = 'Detection/data'
        self.CWD_PATH = os.getcwd()
        self.PATH_TO_CKPT = os.path.join(self.CWD_PATH,self.MODEL_NAME,'frozen_inference_graph.pb') # ssd_inception_v2_coco_trt spellik_trt
        self.PATH_TO_LABELS = os.path.join(self.CWD_PATH,'Detection','labelmap.pbtxt')
        self.label_map = label_map_util.load_labelmap(self.PATH_TO_LABELS)
        self.categories = label_map_util.convert_label_map_to_categories(self.label_map, max_num_classes=NUM_CLASSES, use_display_name=True)
        self.category_index = label_map_util.create_category_index(self.categories)
        # # Load the Tensorflow model into memory.
        self.detection_graph = tf.Graph()
        with self.detection_graph.as_default():
            self.od_graph_def = tf.GraphDef()
            with tf.gfile.GFile(self.PATH_TO_CKPT, 'rb') as fid:
                self.serialized_graph = fid.read()
                self.od_graph_def.ParseFromString(self.serialized_graph)
                tf.import_graph_def(self.od_graph_def, name='')

            self.sess = tf.Session(graph=self.detection_graph)

        # # Define input and output tensors (i.e. data) for the object detection classifier

        # # Input tensor is the image
        self.image_tensor = self.detection_graph.get_tensor_by_name('image_tensor:0')

        # # Output tensors are the detection boxes, scores, and classes
        # # Each box represents a part of the image where a particular object was detected
        self.detection_boxes = self.detection_graph.get_tensor_by_name('detection_boxes:0')

        # # Each score represents level of confidence for each of the objects.
        # # The score is shown on the result image, together with the class label.
        self.detection_scores = self.detection_graph.get_tensor_by_name('detection_scores:0')
        self.detection_classes = self.detection_graph.get_tensor_by_name('detection_classes:0')

        # # Number of objects detected
        self.num_detections = self.detection_graph.get_tensor_by_name('num_detections:0')


    def object_detection(self, image):
        image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        image_expanded = np.expand_dims(image_rgb, axis=0)

        # Perform the actual detection by running the model with the image as input
        (boxes, scores, classes, num) = self.sess.run(
            [self.detection_boxes, self.detection_scores, self.detection_classes, self.num_detections],
            feed_dict={self.image_tensor: image_expanded})
        # for i in range(int(num[0])):
        #     if int(scores[0][i]*100) >= 70:
        
        #         box = boxes[0][i] * np.array([image.shape[0], image.shape[1], image.shape[0], image.shape[1]])        

        #         image = cv2.rectangle(image, (int(box[1]) , int(box[0])), (int(box[3]), int(box[2])), (0, 255, 0), 2)
        #         # print(int(classes[0][i]))
        #         # print(str(self.labels[int(classes[0][i] - 1)])[:-1])
        #         image = cv2.putText(image, str(self.labels[int(classes[0][i])])[:-1], (int(box[3]) - 50, int(box[2]) - 5), cv2.FONT_HERSHEY_SIMPLEX, 2, (0, 255, 0), 3)
        #         image = cv2.putText(image, "% " + str(int(scores[0][i]*100)), (int(box[1]) + 5, int(box[0]) + 15), cv2.FONT_HERSHEY_SIMPLEX, 2, (0, 255, 0), 3) 
        vis_util.visualize_boxes_and_labels_on_image_array(
            image,
            np.squeeze(boxes),
            np.squeeze(classes).astype(np.int32),
            np.squeeze(scores),
            self.category_index,
            use_normalized_coordinates=True,
            line_thickness=16,
            min_score_thresh=0.60)

        #return image, boxes, scores, classes, num
        return image

