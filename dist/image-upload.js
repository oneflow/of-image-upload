angular.module('oneflow.image-upload', [])
    .provider('ofImageUploadSettings', function() {
        this.config = {
          url: '/api/file/getpreupload',
          preuploadConfig: {},
          putConfig: {},
          preupload: function (data) {
            console.log("default", data);
          }
        };

        this.events = {
          'preupload' : function (data) {
            console.log("default", data);
          }
        }

        this.$get = function() {
            console.log(this.config);
            return this.config;
        };

        this.configure = function(config) {
            this.config = _.assign(this.config, config);
        }
    })
    .directive('ofImageUpload', function($compile, $http, ofImageUploadSettings) {
        return {
            restrict: 'E',
            scope: {
                ngModel: '=',
                model: '='
            },
            replace: true,
            templateUrl: 'templates/image-upload.html',
            controller: function($scope, $attrs, $element) {


                $scope.type = $attrs.type;

                $scope.removeImage = function(index) {
                    $scope.ngModel.splice(index, 1);
                };

                $scope.onFileSelect = function(fileUpload) {
                    // $scope = this;

                    var file = fileUpload.files[0];
                    var imageType = /image.*/;

                    if (!file.type.match(imageType)) {
                        $scope.$parent.displayNotification(1, "Not a valid Image file");
                        return;
                    }

                    if (file.size > (1 * 1024 * 1024)) {
                        $scope.$parent.displayNotification(1, "Image too big: Max 1 Megabyte");
                        return;
                    }
                    var selectedimage = $element.find('[name=selectedImage]').get(0);
                    selectedimage.classList.add("obj");
                    selectedimage.file = file;

                    var reader = new FileReader();

                    reader.onload = (function(aImg) {
                        return function(e) {
                            $scope.selectedImage = {
                                data: e.target.result,
                                file: aImg.file
                                    // filename:
                            }


                            $scope.$apply();

                            aImg.src = e.target.result;
                            selectedimage.style.display = "inline";
                        };
                    })(selectedimage);

                    reader.readAsDataURL(file);
                };

                $scope.addProductImage = function() {


                    var fileName = $scope.selectedImage.file.name;
                    var fileType = $scope.selectedImage.file.type;

                    var extSplit = fileName.split('.');
                    var ext = extSplit[extSplit.length - 1].toLowerCase();

                    var imageIndex = $scope.ngModel.length;

                    var url = ofImageUploadSettings.url;

                    /*
                      1. get an upload URL from the API
                      2. upload the file to S3
                      3. save the long expiry download URL to the product.images
                    */

                    ofImageUploadSettings.preupload.call('preupload', this);



                    var getConfig = ofImageUploadSettings.preuploadConfig;
                    var putConfig = ofImageUploadSettings.putConfig;

                    _.defaults(getConfig, {
                        params: {
                            mimeType: fileType
                        }
                    });

                    $http
                        .get(url, getConfig)
                        .success(function(results) {
                            $http.put(results.upload, $scope.selectedImage.file, {
                                withCredentials: false,
                                headers: {
                                    'Authorization': undefined,
                                    'Content-Type': fileType
                                }
                            }).success(function(response) {
                                console.log(response);
                            }).
                            then(function() {
                                $scope.ngModel.push(results.fetch);
                            });
                        })
                        .error(function(error) {
                            console.log(error);
                        })
                        .then(function() {
                            $scope.selectedImage = "";
                        });

                };
            }
        }
    });
angular.module('oneflow.image-upload').run(['$templateCache', function($templateCache) {
  'use strict';

  $templateCache.put('templates/image-upload.html',
    "<div>\n" +
    "  <ul class=\"image-list\">\n" +
    "    <li ng-repeat=\"image in ngModel\">\n" +
    "      <img  ng-src=\"{{image}}\" class=\"image-upload\" />\n" +
    "      <span ng-click=\"removeImage($index)\" class=\"image-text\"><span>Remove</span></span>\n" +
    "    </li>\n" +
    "  </ul>\n" +
    "  <div class=\"clearfix m-b\"></div>\n" +
    "  <input type=\"file\" upload-file-id=\"image-{{model._id}}\" id=\"image-{{model._id}}\" onchange=\"angular.element(this).scope().onFileSelect(this)\" />\n" +
    "  <div class=\"m-t\">\n" +
    "    <img ng-show=\"selectedImage\" style=\"height: 200px;\" id=\"selectedimage\" ng-src=\"{{selectedImage}}\" name=\"selectedImage\" />\n" +
    "  </div>\n" +
    "  <button class=\"m-t btn btn-success\" translate=\"Add Image to {{type}}\" ng-click=\"addProductImage();$event.preventDefault()\">Add Image to {{type}}</button>\n" +
    "</div>\n"
  );

}]);
