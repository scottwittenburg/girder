/**
 * All collections should descend from this collection base class, which
 * provides nice utilities for pagination and sorting.
 */
girder.Collection = Backbone.Collection.extend({
    resourceName: null,

    sortField: 'name',
    sortDir: girder.SORT_ASC,

    // Number of records to fetch per page
    pageLimit: 25,
    offset: 0,

    // Alternative fetch URL
    altUrl: null,

    /**
     * Append mode can be used to append pages to the collection rather than
     * simply replacing its contents when a new page is fetched. For the sake
     * of least surprise, this property should not be changed in the definition
     * of collections, but after they are instantiated.
     */
    append: false,

    /**
     * Returns a boolean of whether or not this collection has previous pages,
     * i.e. if the offset of the current page start is > 0
     */
    hasPreviousPage: function () {
        return this.offset - this.length > 0;
    },

    /**
     * After you have called fetch() on a collection, this method will tell
     * you whether there are more pages remaining to be fetched, or if you
     * have hit the end.
     */
    hasNextPage: function () {
        return this._hasMorePages;
    },

    /**
     * Fetch the previous page of this collection, emitting g:changed when done.
     */
    fetchPreviousPage: function (params) {
        this.offset = Math.max(0, this.offset - this.length - this.pageLimit);
        this.fetch(params);
    },

    /**
     * Fetch the previous page of this collection, emitting g:changed when done.
     */
    fetchNextPage: function (params) {
        this.fetch(_.extend(this.params, params || {}));
    },

    /**
     * Return the 0-indexed page number of the current page. Add 1 to this
     * result when displaying it to the user.
     */
    pageNum: function (params) {
        return Math.ceil((this.offset - this.length) / this.pageLimit);
    },

    /**
     * Fetches the next page of this collection, replacing the existing models
     * of this collection with the requested page. If the next page contains
     * any records (i.e. it was not already on the last page), this will
     * trigger g:changed.
     */
    fetch: function (params) {
        if (this.resourceName === null) {
            alert('Error: You must set a resourceName on your collection.');
            return;
        }

        this.params = params || {};
        girder.restRequest({
            path: this.altUrl || this.resourceName,
            data: _.extend({
                'limit': this.pageLimit + 1,
                'offset': this.offset,
                'sort': this.sortField,
                'sortdir': this.sortDir
            }, this.params)
        }).done(_.bind(function (list) {
            if (list.length > this.pageLimit) {
                // This means we have more pages to display still. Pop off
                // the extra that we fetched.
                list.pop();
                this._hasMorePages = true;
            }
            else {
                this._hasMorePages = false;
            }

            this.offset += list.length;

            if (list.length > 0) {
                if (this.append) {
                    this.add(list);
                }
                else {
                    this.reset(list);
                }
            }

            this.trigger('g:changed');
        }, this));
    }
});
