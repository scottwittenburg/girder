/**
 * This view shows a single collection's page.
 */
girder.views.CollectionView = Backbone.View.extend({
    events: {
        'click .g-edit-collection': 'editCollection',
        'click .g-collection-access-control': 'editAccess'
    },

    initialize: function (settings) {
        // If collection model is already passed, there is no need to fetch.
        if (settings.collection) {
            this.model = settings.collection;
            this.render();
        }
        else if (settings.id) {
            this.model = new girder.models.CollectionModel();
            this.model.set('_id', settings.id);

            this.model.on('g:fetched', function () {
                this.render();
            }, this).fetch();
        }
        // This page should be re-rendered if the user logs in or out
        girder.events.on('g:login', this.userChanged, this);
    },

    editCollection: function () {
        var container = $('#g-dialog-container');

        if (!this.editCollectionWidget) {
            this.editCollectionWidget = new girder.views.EditCollectionWidget({
                el: container,
                model: this.model
            }).off('g:saved').on('g:saved', function (collection) {
                this.render();
            }, this);
        }
        this.editCollectionWidget.render();
    },

    render: function () {
        this.$el.html(jade.templates.collectionPage({
            collection: this.model,
            girder: girder
        }));

        this.hierarchyWidget = new girder.views.HierarchyWidget({
            parentType: 'collection',
            parentModel: this.model,
            el: this.$('.g-collection-hierarchy-container')
        });

        this.$('.g-collection-actions-button').tooltip({
            container: 'body',
            placement: 'left',
            animation: false,
            delay: {show: 100}
        });

        girder.router.navigate('collection/' + this.model.get('_id'));

        return this;
    },

    userChanged: function () {
        // When the user changes, we should refresh the model to update the
        // _accessLevel attribute on the viewed collection, then re-render the
        // page.
        this.model.off('g:fetched').on('g:fetched', function () {
            this.render();
        }, this).on('g:error', function () {
            // Current user no longer has read access to this user, so we
            // send them back to the user list page.
            girder.events.trigger('g:navigateTo',
                girder.views.CollectionsView);
        }, this).fetch();
    },

    editAccess: function () {
        new girder.views.AccessWidget({
            el: $('#g-dialog-container'),
            modelType: 'collection',
            model: this.model
        }).on('g:saved', function (collection) {
            // need to do anything?
        }, this);
    }

});

girder.router.route('collection/:id', 'collection', function (id) {
    // Fetch the collection by id, then render the view.
    var collection = new girder.models.CollectionModel();
    collection.set({
        _id: id
    }).on('g:fetched', function () {
        girder.events.trigger('g:navigateTo', girder.views.CollectionView, {
            collection: collection
        }, collection);
    }, this).on('g:error', function () {
        girder.events.trigger('g:navigateTo', girder.views.CollectionsView);
    }, this).fetch();
});
