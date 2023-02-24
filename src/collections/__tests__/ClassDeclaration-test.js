'use strict';

const getParser = require('./../../getParser');

const recast = require('recast');
const types = recast.types.namedTypes;

describe('ClassDeclarations', function() {
  let nodes;
  let Collection;
  let ClassDeclarationCollection;

  beforeEach(function() {
    jest.resetModules();

    Collection = require('../../Collection');
    ClassDeclarationCollection =  require('../ClassDeclaration');
    ClassDeclarationCollection.register();

    nodes = [recast.parse([
      'class TightA {',
      '  indexPage(classB) {',
      '    console.log(classB.property);',
      '    classB.function("SELECT ...");',
      '  }',
      '}',
      'class TightB {',
      '  property;',
      '  constructor() {',
      '    this.property = 5;',
      '  }',
      '  function(s) {',
      '    console.log(s);',
      '  }',
      '}',
    ].join('\n'), {parser: getParser()}).program];
  });

  describe('Traversal', function() {
    it('adds a root method to find class declarations', function() {
      expect(Collection.fromNodes([]).findClassDeclarations).toBeDefined();
    });

    it('finds all class declarations', function() {
      const declarations = Collection.fromNodes(nodes).findClassDeclarations();
      expect(declarations.getTypes()).toContain('ClassDeclaration');
      expect(declarations.length).toBe(2);
    });

    it('finds class declarations by name', function() {
      const declarations = Collection.fromNodes(nodes)
        .findClassDeclarations('TightB');
      expect(declarations.length).toBe(1);
    });
  });

  describe('Transform', function() {
    it('renames class declarations considering scope', function() {
      Collection.fromNodes(nodes)
        .findClassDeclarations('TightA')
        .renameTo('LooseA');

      const identifiers =
        Collection.fromNodes(nodes)
        .find(types.Identifier, {name: 'LooseA'});

      expect(identifiers.length).toBe(1);
    });

    it('does not rename things that are not classes', function() {
      Collection.fromNodes(nodes)
        .findClassDeclarations('indexPage')
        .renameTo('blarg');

      const identifiers =
        Collection.fromNodes(nodes)
        .find(types.Identifier, {name: 'blarg'});

      expect(identifiers.length).toBe(0);
    });
  });

});
