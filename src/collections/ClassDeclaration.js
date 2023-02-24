'use strict';

const Collection = require('../Collection');
const NodeCollection = require('./Node');
const once = require('../utils/once');
const recast = require('recast');

var types = recast.types.namedTypes;

const ClassDeclaration = recast.types.namedTypes.ClassDeclaration;

/**
* @mixin
*/
const globalMethods = {
  /**
   * Finds all class declarations, optionally filtered by name.
   *
   * @param {string} name
   * @return {Collection}
   */
  findClassDeclarations: function(name) {
    const filter = name ? {id: {name: name}} : null;
    return this.find(ClassDeclaration, filter);
  }
};

/**
* @mixin
*/
const transformMethods = {
  /**
   * Renames a class and all its occurrences.
   *
   * @param {string} newName
   * @return {Collection}
   */
  renameTo: function(newName) {
    return this.forEach(function(path) {
      const node = path.value;
      const oldName = node.id.name;
      const rootScope = path.scope;
      const rootPath = rootScope.path;
      Collection.fromPaths([rootPath])
        .find(types.Identifier, {name: oldName})
        .filter(function(path) { // ignore non-variables
          const parent = path.parent.node;

          if (
            types.MemberExpression.check(parent) &&
            parent.property === path.node &&
            !parent.computed
          ) {
            // obj.oldName
            return false;
          }

          if (
            types.Property.check(parent) &&
            parent.key === path.node &&
            !parent.computed
          ) {
            // { oldName: 3 }
            return false;
          }

          if (
            types.ObjectProperty.check(parent) &&
            parent.key === path.node &&
            !parent.computed
          ) {
            // { oldName: 3 }
            return false;
          }

          if (
            types.ObjectMethod.check(parent) &&
            parent.key === path.node &&
            !parent.computed
          ) {
            // { oldName() {} }
            return false;
          }

          if (
            types.MethodDefinition.check(parent) &&
            parent.key === path.node &&
            !parent.computed
          ) {
            // class A { oldName() {} }
            return false;
          }

          if (
            types.ClassMethod.check(parent) &&
            parent.key === path.node &&
            !parent.computed
          ) {
            // class A { oldName() {} }
            return false;
          }

          if (
            types.ClassProperty.check(parent) &&
            parent.key === path.node &&
            !parent.computed
          ) {
            // class A { oldName = 3 }
            return false;
          }

          if (
            types.JSXAttribute.check(parent) &&
            parent.name === path.node &&
            !parent.computed
          ) {
            // <Foo oldName={oldName} />
            return false;
          }

          return true;
        })
        .forEach(function(path) {
          let scope = path.scope;
          while (scope && scope !== rootScope) {
            if (scope.declares(oldName)) {
              return;
            }
            scope = scope.parent;
          }
          if (scope) {
            const parent = path.parent.node;
            if (
              types.Property.check(parent) &&
              parent.shorthand &&
              !parent.method
            )  {

              path.parent.get('shorthand').replace(false);
            }

            path.get('name').replace(newName);
          }
        });
    });
  }
};


function register() {
  NodeCollection.register();
  Collection.registerMethods(globalMethods);
  Collection.registerMethods(transformMethods, ClassDeclaration);
}

exports.register = once(register);
