import { RenderingContext } from '../RenderingContext';
import { Instance } from '../Instance';
import { TreeAdapter } from './TreeAdapter';
import assert from "assert";
import { Store } from '../../data';

describe('TreeAdapter', () => {

   it('properly expands records', () => {

      let tree = new TreeAdapter({
         childrenField: 'children',
         expandedField: 'expanded'
      });

      let data = [{
         id: 1,
         text: '1',
         expanded: false,
         children: [{
            id: 4,
            text: '4'
         }]
      }, {
         id: 2,
         text: '2',
         expanded: true,
         children: [{
            id: 3,
            text: '3',
            expanded: true,
            children: [{
               id: 5,
               text: '5',
               expanded: true,
               children: [{
                  id: 6,
                  text: '6',
               }]
            }]
         }]
      }, {
         id: 7,
         text: '7',
         expanded: false
      }]

      let store = new Store();

      let records = tree.mapRecords(new RenderingContext(), new Instance(null, 1, null, store), data, store, null);

      assert.equal(records.length, 6);
      assert.equal(records[0].data.id, 1);
      assert.equal(records[1].data.id, 2);
      assert.equal(records[2].data.id, 3);
      assert.equal(records[3].data.id, 5);
      assert.equal(records[4].data.id, 6);
      assert.equal(records[5].data.id, 7);
      assert.equal(records[5].store.get('$record.id'), 7);
      assert.equal(records[2].store.get('$record.id'), 3);
      assert.equal(records[3].store.get('$record.id'), 5);
      assert.equal(records[2].store.get('$record.id'), 3);
      assert.equal(records[0].store.get('$record.id'), 1);
      assert.equal(records[1].store.get('$record.id'), 2);
   });
});

