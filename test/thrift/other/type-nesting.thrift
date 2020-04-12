
typedef list<string> ListOfString 
typedef list<list<string>> ListOfListOfString
typedef map<string, string> MapOfStringString
typedef map<string, list<string>> MapOfStringListOfString
typedef map<string, list<map<string, string>>> MapOfStringListOfMapOfString
typedef map<string, list<map<string, map<string, string>>>> MapOfStringListOfMapOfMapOfString

const string MY_VALUE = 'my_value'
const ListOfString LIST_OF_STRING = ['listA', 'listB']
const ListOfString LIST_OF_STRING_REF = [MY_VALUE, MY_VALUE]
const ListOfListOfString LIST_OF_LIST_OF_STRING = [['listA', 'listB'], ['listC', 'listD']]
const MapOfStringString MAP_OF_STRING = { 'keyA': 'valueA', 'keyB': 'valueB' }
const MapOfStringListOfString MAP_OF_LIST_OF_STRING = { 'keyA': [ { 'listKeyB': 'listValueB' } ] }
const MapOfStringListOfMapOfMapOfString MAP_OF_LIST_OF_MAP_OF_STRING = { 'keyA': [ { 'listKeyAA': { 'keyAAA': 'valueC', 'keyAAB': 'valueD' }, 'listKeyAB': { 'keyABA': 'valueC', 'keyABB': 'valueD' } } ] }
const MapOfStringListOfMapOfMapOfString MAP_OF_LIST_OF_MAP_OF_STRING_2 = MAP_OF_LIST_OF_MAP_OF_STRING
