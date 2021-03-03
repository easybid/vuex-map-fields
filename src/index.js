// eslint-disable-next-line
import { computed, getCurrentInstance } from '@vue/composition-api';
import arrayToObject from './lib/array-to-object';

function getStoreFromInstance() {
  const vm = getCurrentInstance();
  if (!vm) {
    throw new Error(`You must use this function within the "setup()" method, or insert the store as first argument.`);
  }
  const { $store } = `proxy` in vm ? vm.proxy : vm;
  return $store;
}

function objectEntries(obj) {
  return Object.keys(obj).map(key => [key, obj[key]]);
}

function normalizeNamespace(store, fn) {
  return (...params) => {
    // eslint-disable-next-line prefer-const
    let [namespace, map, getterType, mutationType] = typeof params[0] === `string`
      ? [...params]
      : [``, ...params];

    if (namespace.length && namespace.charAt(namespace.length - 1) !== `/`) {
      namespace += `/`;
    }

    getterType = `${namespace}${getterType || `getField`}`;
    mutationType = `${namespace}${mutationType || `updateField`}`;

    if (typeof store === `function`) {
      // eslint-disable-next-line no-param-reassign
      fn = store;
      // eslint-disable-next-line no-param-reassign
      store = null;
    }
    return fn(store, namespace, map, getterType, mutationType);
  };
}

export function getField(state) {
  return path => path.split(/[.[\]]+/).reduce((prev, key) => prev[key], state);
}

export function updateField(state, { path, value }) {
  path.split(/[.[\]]+/).reduce((prev, key, index, array) => {
    if (array.length === index + 1) {
      // eslint-disable-next-line no-param-reassign
      prev[key] = value;
    }

    return prev[key];
  }, state);
}

export const mapFields = normalizeNamespace((
  store,
  namespace,
  fields,
  getterType,
  mutationType,
) => {
  if (!store) {
    // eslint-disable-next-line no-param-reassign
    store = getStoreFromInstance();
  }
  const fieldsObject = Array.isArray(fields) ? arrayToObject(fields) : fields;

  return Object.keys(fieldsObject).reduce((prev, key) => {
    const path = fieldsObject[key];
    const field = computed({
      get() {
        return store.getters[getterType](path);
      },
      set(value) {
        store.commit(mutationType, { path, value });
      },
    });

    // eslint-disable-next-line no-param-reassign
    prev[key] = field;

    return prev;
  }, {});
});

export const mapMultiRowFields = normalizeNamespace((
  store,
  namespace,
  paths,
  getterType,
  mutationType,
) => {
  if (!store) {
    // eslint-disable-next-line no-param-reassign
    store = getStoreFromInstance();
  }
  const pathsObject = Array.isArray(paths) ? arrayToObject(paths) : paths;

  return Object.keys(pathsObject).reduce((entries, key) => {
    const path = pathsObject[key];

    // eslint-disable-next-line no-param-reassign
    entries[key] = {
      get() {
        const rows = objectEntries(store.getters[getterType](path));

        return rows
          .map(fieldsObject => Object.keys(fieldsObject[1]).reduce((prev, fieldKey) => {
            const fieldPath = `${path}[${fieldsObject[0]}].${fieldKey}`;

            return Object.defineProperty(prev, fieldKey, computed({
              get() {
                return store.getters[getterType](fieldPath);
              },
              set(value) {
                store.commit(mutationType, { path: fieldPath, value });
              },
            }));
          }, {}));
      },
    };

    return entries;
  }, {});
});

export const createHelpers = ({ store, getterType, mutationType }) => ({
  [getterType]: getField,
  [mutationType]: updateField,
  mapFields: normalizeNamespace(store, (namespace, fields) => mapFields(
    namespace,
    fields,
    getterType,
    mutationType,
  )),
  mapMultiRowFields: normalizeNamespace(store, (namespace, paths) => mapMultiRowFields(
    namespace,
    paths,
    getterType,
    mutationType,
  )),
});
