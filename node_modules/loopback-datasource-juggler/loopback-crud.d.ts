declare module "loopback" {
  namespace db {
    type Callback<T> = (err:Error|string, obj:T) => any;
    type Options = Object;
    type Where = Object;

    /**
     * Query filter
     */
    export interface Filter {
      where?:Where, // Matching properties
      limit?:number, // Maximum number of documents to be returned
      offset?:number, // Starting index of documents
      skip?: number, // Alias to offset
      fields?:string[]|Object, // Fields to be included/excluded
      order?:string|string[], // An array of order by
      include?:string|string[]|Object|Object[] // Related models to be included
    }

    export interface DataAccessObject<T> {
      /**
       *
       * @param data
       * @param options
       * @param callback
       */
      create(data:T|T[], options?:Options, callback?:Callback<T|T[]>):any;

      /**
       *
       * @param data
       * @param options
       * @param callback
       */
      updateOrCreate(data:T, options?:Options, callback?:Callback<T|T[]>):any;
      patchOrCreate(data:T, options?:Options, callback?:Callback<T|T[]>):any;
      upsert(data:T, options?:Options, callback?:Callback<T|T[]>):any;

      /**
       *
       * @param filter
       * @param data
       * @param options
       * @param callback
       */
      findOrCreate(filter:Filter, data:T, options?:Options, callback?:Callback<T[]>):any;

      /**
       *
       * @param data
       * @param options
       * @param callback
       */
      replaceOrCreate(data:T|T[], options?:Options, callback?:Callback<T|T[]>):any;

      /**
       *
       * @param filter
       * @param options
       * @param callback
       */
      find(filter?:Filter, options?:Options, callback?:Callback<T[]>):any;

      /**
       *
       * @param id
       * @param filter
       * @param options
       * @param callback
       */
      findById(id:any, filter?:Filter, options?:Options, callback?:Callback<T>):any;

      /**
       *
       * @param id
       * @param filter
       * @param options
       * @param callback
       */
      findByIds(id:any[], filter?:Filter, options?:Options, callback?:Callback<T[]>):any;

      /**
       *
       * @param filter
       * @param options
       * @param callback
       */
      fineOne(filter?:Filter, options?:Options, callback?:Callback<T>):any;

      /**
       *
       * @param id
       * @param options
       * @param callback
       */
      deleteById(id:any, options?:Options, callback?:Callback<number>):any;
      removeById(id:any, options?:Options, callback?:Callback<number>):any;
      destroyById(id:any, options?:Options, callback?:Callback<number>):any;

      /**
       *
       * @param id
       * @param data
       * @param options
       * @param callback
       */
      updateById(id:any, data:T|Object, options?:Options, callback?:Callback<T>):any;

      /**
       *
       * @param id
       * @param data
       * @param options
       * @param callback
       */
      replaceById(id:any, data:T|Object, options?:Options, callback?:Callback<T>):any;

      /**
       *
       * @param where
       * @param options
       * @param callback
       */
      count(where?:Where, options?:Options, callback?:Callback<number>):any;

      /**
       *
       * @param id
       * @param options
       * @param callback
       */
      exists(id:any, options?:Options, callback?:Callback<T>):any;


      update(where?:Where, data?:T, options?:Options, callback?:Callback<T>):any;
      updateAll(where?:Where, data?:T, options?:Options, callback?:Callback<T>):any;

      /**
       *
       * @param where
       * @param options
       * @param callback
       */
      remove(where?:Where, options?:Options, callback?:Callback<number>):any;
      removeAll(where?:Where, options?:Options, callback?:Callback<number>):any;
      destroyAll(where?:Where, options?:Options, callback?:Callback<number>):any;
    }

    /**
     * Instance methods for a data object
     */
    export interface DataObject<T> {
      /**
       *
       * @param options
       * @param callback
       */
      save(options?:Options, callback?:Callback<T>):any;

      /**
       *
       * @param options
       * @param callback
       */
      remove(options?:Options, callback?:Callback<T>):any;
      delete(options?:Options, callback?:Callback<T>):any;
      destroy(options?:Options, callback?:Callback<T>):any;

      /**
       *
       * @param data
       * @param options
       * @param callback
       */
      updateAttributes(data:T|Object, options?:Options, callback?:Callback<T>):any;
      patchAttributes(data:T|Object, options?:Options, callback?:Callback<T>):any;

      /**
       * Replace the model instance with attributes from the data object
       * @param {T|Object} data Data object keyed by property names
       * @param options
       * @param callback
       */
      replaceAttributes(data:T|Object, options?:Options, callback?:Callback<T>):any;
    }
  }
}
