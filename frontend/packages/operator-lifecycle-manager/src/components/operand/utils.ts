import * as _ from 'lodash';
import * as Immutable from 'immutable';
import { JSONSchema7 } from 'json-schema';
import { SpecCapability, Descriptor } from '../descriptors/types';
import { modelFor } from '@console/internal/module/k8s';
import { capabilityFieldMap, capabilityWidgetMap } from '../descriptors/spec/spec-descriptor-input';
import { HIDDEN_UI_SCHEMA, REGEXP_K8S_RESOURCE_SUFFIX, REGEXP_SELECT_OPTION, REGEXP_FIELD_DEPENDENCY_PATH_VALUE, SORT_WEIGHT_SCALE_1, SORT_WEIGHT_SCALE_2, SORT_WEIGHT_SCALE_3 } from './const';
import { SchemaType } from '@console/shared/src/components/dynamic-form';
import { getSchemaType } from '@rjsf/core/lib/utils';
import { getSchemaErrors } from '@console/shared/src/components/dynamic-form/utils';
import { isArray } from 'lodash';
import { UiSchema } from '@rjsf/core';

// Transform a path string from a descriptor to a JSON schema path array
export const descriptorPathToUISchemaPath = (path: string): string[] =>
  (_.toPath(path) ?? []).map(subPath => {
    return /^\d+$/.test(subPath) ? 'items' : subPath;
  });

// Determine if a given path is defined on a JSONSchema
export const jsonSchemaHas = (jsonSchema: JSONSchema7, schemaPath: string[]): boolean => {
  const [next, ...rest] = schemaPath;
  const nextSchema = jsonSchema?.[next] ?? jsonSchema?.properties?.[next];
  if (rest.length && !!nextSchema) {
    return jsonSchemaHas(nextSchema, rest);
  }
  return !!nextSchema;
};

// Applies a hidden widget and label configuration to every property of the given schema.
// This is useful for whitelisting only a few schema properties when all properties are not known.
export const hideAllExistingProperties = (schema: JSONSchema7) => {
  return _.reduce(
    schema?.properties,
    (acc, _unused, propertyName) => ({
      ...acc,
      [propertyName]: HIDDEN_UI_SCHEMA,
    }),
    {},
  );
};

// Determine if a schema will produce an empty form field.
export const hasNoFields = (jsonSchema: JSONSchema7 = {}): boolean => {
  // If schema is empty or has unsupported properties, it will not render any fields on the form
  if (getSchemaErrors(jsonSchema).length > 0) {
    return true;
  }

  const type = getSchemaType(jsonSchema) ?? '';
  const handleArray = () => {
    return hasNoFields(jsonSchema.items as JSONSchema7);
  };
  const handleObject = () => {
    return _.every(jsonSchema?.properties, hasNoFields) && !jsonSchema?.additionalProperties;
    //  && hasNoFields(jsonSchema?.additionalProperties as JSONSchema7);
  };

  switch (type) {
    case SchemaType.array:
      return handleArray();
    case SchemaType.object:
      return handleObject();
    // case '':
    //   return true; // type이 없는 parameter에 경우 form editor 안그리는 로직 있던 거 제거
    default:
      return false;
  }
};

const isValidOneofComponent = target => {
  if (_.isArray(target)) {
    return target.every(cur => 'title' in cur);
  } else {
    return 'title' in target;
  }
};

// Map json schema to default ui schema
export const getDefaultUISchema = (jsonSchema: JSONSchema7, jsonSchemaName: string): UiSchema => {
  const type = getSchemaType(jsonSchema ?? {});
  if (hasNoFields(jsonSchema)) {
    return HIDDEN_UI_SCHEMA;
  }
  if (!!jsonSchema?.additionalProperties) {
    if (jsonSchemaName.toLowerCase().indexOf('label') >= 0 || jsonSchemaName.toLowerCase().indexOf('annotation') >= 0 || jsonSchemaName.toLowerCase().indexOf('selector') >= 0) {
      return {
        'ui:field': 'LabelsField',
      };
    }
    return {
      'ui:field': 'AdditionalPropertyField',
    };
  } else if (jsonSchemaName === 'owner' && jsonSchema?.description.indexOf(`Don't deal with this field.`) >= 0) {
    delete jsonSchema?.description;
    delete jsonSchema?.type;
  } else if (jsonSchema?.['x-kubernetes-int-or-string'] || jsonSchema?.['anyOf']) {
    if (
      isArray(jsonSchema.anyOf) &&
      jsonSchema.anyOf.every(cur => {
        if (isArray(cur?.['type'])) {
          return cur['type'][0] === 'string' || cur['type'][0] === 'number' || cur['type'][0] === 'null' || cur['type'][0] === 'integer';
        } else if (cur?.['type']) {
          return cur['type'] === 'string' || cur['type'] === 'number' || cur['type'] === 'null' || cur['type'] === 'integer';
        }
      })
    ) {
      delete jsonSchema?.anyOf;
      jsonSchema.type = 'string';
    }
    delete jsonSchema?.anyOf;
  } else if (jsonSchema?.['oneOf']) {
    if (isValidOneofComponent(jsonSchema.oneOf)) {
      return {
        'ui:field': 'OneOfField', // number or string 일 경우에 컴포넌트
      };
    }
  } else if (jsonSchema?.['allOf']) {
    if (
      isArray(jsonSchema.allOf) &&
      jsonSchema.allOf.every(cur => {
        if (isArray(cur?.['type'])) {
          return cur['type'][0] === 'string' || cur['type'][0] === 'number' || cur['type'][0] === 'null' || cur['type'][0] === 'integer';
        } else if (cur?.['type']) {
          return cur['type'] === 'string' || cur['type'] === 'number' || cur['type'] === 'null' || cur['type'] === 'integer';
        }
      })
    ) {
      delete jsonSchema?.allOf;
      jsonSchema.type = 'string';
    }
    delete jsonSchema?.allOf;
  } else if (jsonSchema?.format === 'data-url' && jsonSchema.type === 'string') {
    return {
      'ui:widget': 'fileUploadWidget',
    };
  } else if (jsonSchemaName === 'provider' && jsonSchema.enum?.length > 0) {
    return {
      'ui:field': 'ProviderDropdownField',
    };
  }

  const handleArray = () => {
    const itemsUISchema = getDefaultUISchema(jsonSchema.items as JSONSchema7, '');
    return !_.isEmpty(itemsUISchema) ? { items: itemsUISchema } : {};
  };

  const handleObject = () => {
    return _.reduce(
      jsonSchema.properties,
      (uiSchemaAccumulator: UiSchema, property: JSONSchema7, name: string) => {
        const propertyUISchema = getDefaultUISchema(property, name);
        return _.isEmpty(propertyUISchema)
          ? uiSchemaAccumulator
          : {
              ...(uiSchemaAccumulator ?? {}),
              [name]: propertyUISchema,
            };
      },
      {},
    );
  };
  switch (type) {
    case SchemaType.array:
      return handleArray();
    case SchemaType.object:
      return handleObject();
    default:
      return {};
  }
};

const k8sResourceCapabilityToUISchema = (capability: SpecCapability): UiSchema => {
  const [, groupVersionKind] = capability.match(REGEXP_K8S_RESOURCE_SUFFIX) ?? [];
  const model = groupVersionKind && modelFor(groupVersionKind);
  if (model) {
    return {
      'ui:widget': 'K8sResourceWidget',
      'ui:options': { model, groupVersionKind },
    };
  }
  return {};
};

const fieldDependencyCapabilityToUISchema = (capability: SpecCapability): UiSchema => {
  const [, path, value] = capability.match(REGEXP_FIELD_DEPENDENCY_PATH_VALUE) ?? [];
  if (!!path && !!value) {
    return { 'ui:dependency': { path: descriptorPathToUISchemaPath(path), value } };
  }
  return {};
};

const selectCapabilitiesToUISchema = (capabilities: SpecCapability[]): UiSchema => {
  const items = capabilities.reduce((optionAccumulator, capability) => {
    const [, option] = capability.match(REGEXP_SELECT_OPTION) ?? [];
    return {
      ...optionAccumulator,
      ...(option && { [option]: option }),
    };
  }, {});

  if (!_.isEmpty(items)) {
    return {
      'ui:field': 'DropdownField',
      'ui:items': items,
    };
  }

  return {};
};

// Given an array of SpecCapabilities, return the appropriate corresponding UISchema
export const capabilitiesToUISchema = (capabilities: SpecCapability[] = []) => {
  if (!capabilities?.length) {
    return {};
  }

  const k8sResourceCapability = _.find(capabilities, capability => capability.startsWith(SpecCapability.k8sResourcePrefix));
  if (k8sResourceCapability) {
    return k8sResourceCapabilityToUISchema(k8sResourceCapability);
  }

  const fieldDependencyCapability = _.find(capabilities, capability => capability.startsWith(SpecCapability.fieldDependency));
  if (fieldDependencyCapability) {
    return fieldDependencyCapabilityToUISchema(fieldDependencyCapability);
  }

  const hasSelectOptions = _.some(capabilities, capability => capability.startsWith(SpecCapability.select));
  if (hasSelectOptions) {
    return selectCapabilitiesToUISchema(capabilities);
  }

  const field = _.reduce(
    capabilities,
    (fieldAccumulator, capability) => {
      return fieldAccumulator ?? capabilityFieldMap.get(capability);
    },
    undefined,
  );

  const widget = _.reduce(
    capabilities,
    (widgetAccumulator, capability) => {
      return widgetAccumulator ?? capabilityWidgetMap.get(capability);
    },
    undefined,
  );

  return {
    ...(field && { 'ui:field': field }),
    ...(widget && { 'ui:widget': widget }),
  };
};

// Given a JSONSchema and associated uiSchema, create the appropriat ui schema order property for the jsonSchema.
// Orders properties according to the following rules:
//  - required properties with an associated ui schema come first,
//  - required properties without an associated ui schema next,
//  - optional fields with an associated ui schema next,
//  - all other properties
export const getJSONSchemaOrder = (jsonSchema, uiSchema) => {
  const type = getSchemaType(jsonSchema ?? {});
  const handleArray = () => {
    const descendantOrder = getJSONSchemaOrder(jsonSchema?.items as JSONSchema7, uiSchema?.items);
    return !_.isEmpty(descendantOrder) ? { items: descendantOrder } : {};
  };

  const handleObject = () => {
    const propertyNames = _.keys(jsonSchema?.properties ?? {});
    if (_.isEmpty(propertyNames)) {
      return {};
    }

    // Map control fields to an array so that  an index can be used to apply a modifier to sort weigths of dependent fields
    const controlProperties = _.reduce(
      uiSchema,
      (controlPropertyAccumulator, { 'ui:dependency': dependency }) => {
        const control = _.last(dependency?.path ?? []);
        return !control ? controlPropertyAccumulator : [...controlPropertyAccumulator, control];
      },
      [],
    );

    /**
     * Give a property name a sort wieght based on whether it has a descriptor (uiSchema has property), is required, or is a control
     * field for a property with a field dependency. A lower weight means higher sort order. Fields are weighted according to the following criteria:
     *  - Required fields with descriptor - 0 to 999
     *  - Required fields without descriptor 1000 to 1999
     *  - Optional fields with descriptor 2000 to 2999
     *  - Control fields that don't fit any above - 3000 to 3999
     *  - All other fields - Infinity
     *
     * Within each of the above criteria, fields are further weighted based on field dependency:
     *   - Fields without dependency - base weight
     *   - Control field - base weight  + (nth control field) * 100
     *   - Dependent field - corresponding control field weight + 10
     *
     * These weight numbers are arbitrary, but spaced far enough apart to leave room for multiple levels of sorting.
     */
    const getSortWeight = (property: string): number => {
      // This property's control field, if it exists
      const control = _.last<string>(uiSchema?.[property]?.['ui:dependency']?.path ?? []);

      // A small offset that is added to the base weight so that control fields get sorted last within
      // their appropriate group
      const controlOffset = (controlProperties.indexOf(property) + 1) * SORT_WEIGHT_SCALE_2;

      // If this property is a dependent, it's weight is based on it's control property
      if (control) {
        return getSortWeight(control) + controlOffset + SORT_WEIGHT_SCALE_1;
      }

      const isRequired = (jsonSchema?.required ?? []).includes(property);
      const hasDescriptor = uiSchema?.[property];

      // Required fields with a desriptor are sorted first (lowest weight).
      if (isRequired && hasDescriptor) {
        return SORT_WEIGHT_SCALE_3 + controlOffset;
      }

      // Fields that are required, but have no descriptors get sorted next
      if (isRequired) {
        return SORT_WEIGHT_SCALE_3 * 2 + controlOffset;
      }

      // Optional fields with descriptors get sorted next
      if (hasDescriptor) {
        return SORT_WEIGHT_SCALE_3 * 3 + controlOffset;
      }

      // Control fields that don't fit into any of the above criteria come next
      if (controlOffset > 0) {
        return SORT_WEIGHT_SCALE_3 * 4 + controlOffset;
      }

      // All other fields are sorted in the order in which they are encountered
      // in the schema
      return Infinity;
    };

    const uiOrder = Immutable.Set(propertyNames)
      .sortBy(getSortWeight)
      .toJS();

    return {
      ...(uiOrder.length > 1 && { 'ui:order': uiOrder }),
      ..._.reduce(
        jsonSchema?.properties ?? {},
        (orderAccumulator, property, propertyName) => {
          const descendantOrder = getJSONSchemaOrder(property, uiSchema?.[propertyName]);
          if (_.isEmpty(descendantOrder)) {
            return orderAccumulator;
          }
          return {
            ...orderAccumulator,
            [propertyName]: descendantOrder,
          };
        },
        {},
      ),
    };
  };

  switch (type) {
    case SchemaType.array:
      return handleArray();
    case SchemaType.object:
      return handleObject();
    default:
      return {};
  }
};

// Map a set of spec descriptors to a ui schema
export const descriptorsToUISchema = (descriptors: Descriptor<SpecCapability>[], jsonSchema: JSONSchema7) => {
  const uiSchemaFromDescriptors = _.reduce(
    descriptors,
    (uiSchemaAccumulator, { path, description, displayName, 'x-descriptors': capabilities = [] }) => {
      const uiSchemaPath = descriptorPathToUISchemaPath(path);
      if (!jsonSchemaHas(jsonSchema, uiSchemaPath)) {
        // eslint-disable-next-line no-console
        console.warn('SpecDescriptor path references a non-existent schema property:', path);
        return uiSchemaAccumulator;
      }
      const isAdvanced = _.includes(capabilities, SpecCapability.advanced);
      const capabilitiesUISchema = capabilitiesToUISchema(_.without(capabilities, SpecCapability.advanced));
      return uiSchemaAccumulator.withMutations(mutable => {
        if (isAdvanced) {
          const advancedPropertyName = _.last(uiSchemaPath);
          const pathToAdvanced = [...uiSchemaPath.slice(0, uiSchemaPath.length - 1), 'ui:advanced'];
          const currentAdvanced = mutable.getIn(pathToAdvanced) ?? Immutable.List();
          mutable.setIn(pathToAdvanced, currentAdvanced.push(advancedPropertyName));
        }

        mutable.setIn(
          uiSchemaPath,
          Immutable.Map({
            ...(description && { 'ui:description': description }),
            ...(displayName && { 'ui:title': displayName }),
            ...capabilitiesUISchema,
          }),
        );
      });
    },
    Immutable.Map(),
  ).toJS();
  // return _.merge(uiSchemaFromDescriptors, getJSONSchemaOrder(jsonSchema, uiSchemaFromDescriptors)); // schema 우선순위 정렬 로직
  return _.merge(jsonSchema, uiSchemaFromDescriptors);
};

// Use jsonSchema, descriptors, and some defaults to generate a uiSchema
export const getUISchema = (jsonSchema, providedAPI) => {
  return _.defaultsDeep(
    {
      metadata: {
        ...hideAllExistingProperties(jsonSchema?.properties?.metadata as JSONSchema7),
        name: {
          'ui:title': 'Name',
          'ui:widget': 'TextWidget',
        },
        labels: {
          'ui:title': 'Labels',
          'ui:field': 'LabelsField',
        },
        'ui:options': {
          label: false,
        },
        'ui:order': ['name', 'labels', '*'],
      },
      spec: {
        ...descriptorsToUISchema(providedAPI?.specDescriptors, jsonSchema?.properties?.spec),
        'ui:options': {
          label: false,
        },
      },
      'ui:order': ['metadata', 'spec', '*'],
    },
    getDefaultUISchema(jsonSchema, ''),
  );
};
