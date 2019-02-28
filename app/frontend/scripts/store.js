import Vue from 'vue';
import Vuex from 'vuex';
import axios from 'axios';
import { apiConfig } from './config/api.js';
import {csvParse} from 'd3-dsv';
import {searchProjects, getSpiders} from './cisProjectSearchAPI.js';

Vue.use(Vuex)

const SOURCE_FILTER_NAME = 'source_';

function makeSourceFilterFromSpiders(spiders){
    return {
        "fullname": "Source",
        "name": SOURCE_FILTER_NAME,
        "choices": [ ...Object.entries(spiders)]
            .map(([id, {name}]) => ({
                "fullname": name,
                "id": id,
                "spiderId": id,
                "name": name
            }))
            .sort((a, b) => a.name.localeCompare(b.name))
    }
}


function filterValuesToCISTags(filterValues){
    const cisTags = new Set();

    const categoriesByUITag = CATEGORIES_CIS_DICT_FLAT;
    const cisTagByCategory = NORMALIZATION_TAGS_SOURCES_CIS_DICT;

    let uiTags = [];
    for(const [filter, tags] of filterValues.entries()){
        uiTags = [...uiTags, ...([...tags].map(t => filter+t))]
    }

    for(const uiTag of uiTags){
        const categories = categoriesByUITag[uiTag];

        for(const category of categories){
            const categoriesCISTags = cisTagByCategory[category];

            for(const tag of categoriesCISTags){
                cisTags.add(tag);
            }
        }
    }

    return cisTags;
}

const INITIAL_FILTER_DESCRIPTIONS = CHOICES_FILTERS_TAGS.filter(c => c.name !== 'methods_')


function makeEmptySelectedFilters(filterDescriptions){
    const selectedFilters = new Map()
    for(const f of filterDescriptions){
        selectedFilters.set(f.name, new Set())
    }
    return selectedFilters;
}


export const storeGenerator = new Vuex.Store({
    strict: true,
    state: {
        user: {
            userName: '',
            userSurname: '',
            isLoggedin: false,
            isVerified: false
        },
        jwt:undefined,
        config:{},
        geolocByProjectId: new Map(),
        spiders: undefined,

        displayedProject: undefined,

        filterDescriptions: INITIAL_FILTER_DESCRIPTIONS,
        search: {
            question: {
                query: new URL(location).searchParams.get('text') || '',
                selectedFilters: makeEmptySelectedFilters(INITIAL_FILTER_DESCRIPTIONS)
            },
            answer: {
                pendingAbort: undefined, // function that can be used to abort the current pending search
                result: undefined, // search results {projects, total}
                error: undefined // if last search ended in an error
            }
        }

    },
    mutations: {
        setSearchedText (state, {searchedText}) {
            state.search.question.query = searchedText
        },
        setSelectedFilters (state, {selectedFilters}) {
            // trigger re-render
            state.search.question.selectedFilters = new Map(selectedFilters)
        },
        emptyOneFilter (state, {filter}) {
            state.search.question.selectedFilters.set(filter, new Set())

            // trigger re-render
            state.search.question.selectedFilters = new Map(state.search.question.selectedFilters)
        },
        clearAllFilters(state){
            state.search.question.selectedFilters = makeEmptySelectedFilters(state.filterDescriptions)
        },

        setSearchResult(state, {result}){
            state.search.answer = {
                pendingAbort: undefined,
                result,
                error: undefined
            }
        },
        setSearchPending(state, {pendingAbort}){
            state.search.answer = {
                pendingAbort,
                result: undefined,
                error: undefined
            }
        },
        setSearchError(state, {error}){
            console.error('search error', error)
            state.search.answer = {
                pendingAbort: undefined,
                result: undefined,
                error
            }
        },

        setSourceFilter(state, {sourceFilter}){
            const sourceFilterIndex = state.filterDescriptions.findIndex(fd => fd.name === SOURCE_FILTER_NAME)

            if(sourceFilterIndex !== -1){
                state.filterDescriptions[sourceFilterIndex] = sourceFilter
            }
            else{
                state.filterDescriptions.push(sourceFilter);
                state.search.question.selectedFilters.set(SOURCE_FILTER_NAME, new Set())
                //state.filterDescriptions = state.filterDescriptions
            }
        },

        setDisplayedProject(state, {project}){
            state.displayedProject = project;
        },
        setSpiders(state, {spiders}){
            state.spiders = spiders
        },
        addGeolocs(state, {geolocByProjectId}){
            state.geolocByProjectId = new Map([...state.geolocByProjectId, ...geolocByProjectId])
        },
        setConfig (state, {configType,configResult}) {
            state.config[configType] = (configResult && configResult.data && configResult.data.app_config) ? configResult.data.app_config : ''
        }
    },
    actions: {
        toggleFilter({state, commit, dispatch}, {filter, value}){
            const selectedFilters = state.search.question.selectedFilters
            const selectedValues = selectedFilters.get(filter)
            if(selectedValues.has(value))
                selectedValues.delete(value)
            else
                selectedValues.add(value)

            commit('setSelectedFilters', {selectedFilters})
            dispatch('search')
        },

        emptyOneFilter({state, commit, dispatch}, {filter}){
            const selectedFilters = state.search.question.selectedFilters
            selectedFilters.set(filter, new Set())

            commit('setSelectedFilters', {selectedFilters})
            dispatch('search')
        },

        clearAllFilters({commit, dispatch}){
            commit('clearAllFilters')
            dispatch('search')
        },

        searchedTextChanged({commit, dispatch}, {searchedText}){
            commit('setSearchedText', {searchedText})
            dispatch('search')
        },

        search({state, commit}){
            const {search} = state;
            const selectedFiltersWithoutSourceurs = new Map(search.question.selectedFilters)
            selectedFiltersWithoutSourceurs.delete(SOURCE_FILTER_NAME);

            const cisTags = filterValuesToCISTags(selectedFiltersWithoutSourceurs)

            const selectedSources = search.question.selectedFilters.get(SOURCE_FILTER_NAME)

            const spiderIds = selectedSources ? [...selectedSources].map(source => {
                return [...Object.entries(store.state.spiders)].find(([id, spider]) => spider.name === source)[0]
            }) : undefined;

            // abort previous search if any
            if(search.answer.pendingAbort){
                search.answer.pendingAbort.abort()
            }

            // perform search
            const searchPendingAbort = searchProjects(search.question.query, cisTags, spiderIds)

            commit('setSearchPending', {pendingAbort: searchPendingAbort})

            searchPendingAbort.promise
                .then(({projects, total}) => {
                    commit('setSearchResult', {result: {projects, total}})
                })
                .catch(error => {
                    // don't report aborted fetch as errors
                    if (error.name !== 'AbortError')
                        commit('setSearchError', {error})
                })
        },
        getSpiders({commit}){
            getSpiders()
            .then(spiders => {
                commit('setSpiders', {spiders})
                commit('setSourceFilter', {sourceFilter: makeSourceFilterFromSpiders(spiders)})
            })
            .catch(err => console.error('err getSpiders', text, err))
        },
        findProjectsGeolocs({commit}, projects){
            const projectWithValidAddress = projects.filter(p => p['address'])
            const addresses = projectWithValidAddress.map(p => p['address'].replace(/[^(\w|\s)]/g, '').slice(0, 200) )

            const adressesCSV = 'adresse\n' + addresses.join('\n')
            const adresseCSVBANBody = new FormData();
            adresseCSVBANBody.append('data', new File([adressesCSV], 'adresses.csv'))

            return fetch('https://api-adresse.data.gouv.fr/search/csv/', {
                method: 'POST',
                body: adresseCSVBANBody,
            })
            .then(r => r.text())
            .then(geolocsTxt => {
                const geolocs = csvParse(geolocsTxt);

                const geolocByProjectId = new Map();

                projectWithValidAddress.forEach(({id}, i) => {
                    const {latitude, longitude} = geolocs[i];

                    geolocByProjectId.set(
                        id,
                        (Number.isFinite(parseFloat(latitude)) && Number.isFinite(parseFloat(longitude))) ?
                            {latitude: parseFloat(latitude), longitude: parseFloat(longitude)} :
                            false
                    )
                })

                projects.forEach(({id}) => {
                    if(!geolocByProjectId.has(id)){
                        geolocByProjectId.set(id, false)
                    }
                })

                commit('addGeolocs', {geolocByProjectId})
            });
        },
        getConfig({commit}) {
          axios
            .get(apiConfig.rootURL+'/config/global')
            .then(response => commit('setConfig', {configType:'global',configResult:response}) )
          axios
            .get(apiConfig.rootURL+'/config/styles')
            .then(response => commit('setConfig', {configType:'styles',configResult:response}) )
          axios
            .get(apiConfig.rootURL+'/config/routes?as_list=true')
            .then(response => commit('setConfig', {configType:'routes',configResult:response}) )
          axios
            .get(apiConfig.rootURL+'/config/endpoints')
            .then(response => commit('setConfig', {configType:'endpoints',configResult:response}) )
        }
    }
})
