#!/bin/bash

npm pack ./
rm -Rf ./test/package
tar -xzf vuex-composition-map-fields-*.tgz -C ./test
rm -f vuex-composition-map-fields-*.tgz
# Rename the fake published package to prevent Jest from
# complaining about two packages having the same name.
sed -i -e 's/vuex-composition-map-fields/fake-vuex-composition-map-fields/g' ./test/package/package.json
