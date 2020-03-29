
typedef list<string> ListOfString 
typedef map<string, string> MapOfStringString
typedef map<string, list<string>> MapOfStringListOfString
typedef map<string, list<map<string, string>>> MapOfStringListOfMapOfString
typedef map<string, list<map<string, map<string, string>>>> MapOfStringListOfMapOfMapOfString

const ListOfString LIST_OF_STRING = ['a', 'b']
const MapOfStringString MAP_OF_STRING = { 'a': '1', 'b': '2' }
const MapOfStringListOfString MAP_OF_LIST_OF_STRING = { 'a': [ { 'b': '2' } ] }
const MapOfStringListOfMapOfMapOfString MAP_OF_LIST_OF_MAP_OF_STRING = { 'a': [ { 'b': { 'c': '2' } } ] }