import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import {Pressable, Image, ScrollView, StyleSheet, Text,  View, TextInput} from 'react-native';
import { Audio } from 'expo-av';

export default function App() {
  const [pokemonList, setPokemonList] = useState([]);
  const [sortedPokemonList, setSortedPokemonList] = useState([]);
  const [isSorted, setIsSorted] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [filteredPokemonList, setFilteredPokemonList] = useState([]);
  const handleSearch = (text) => {  
    setSearchText(text);
    if (text === '') {
        setFilteredPokemonList([]);
    } else {
        const filtered = isSorted ? sortedPokemonList : pokemonList;
        const result = filtered.filter(pokemon => {
            const searchTextLower = text.toLowerCase();
            
            // Check for name match
            const nameMatch = pokemon.name.toLowerCase().includes(searchTextLower);
            
            // Check for type match (assuming types is an array)
            const typeMatch = pokemon.types.some(typeObj => typeObj.type.name.toLowerCase().includes(searchTextLower));
            
            // Check for ID match
            const idMatch = String(pokemon.id) === searchTextLower;

            

            return nameMatch || typeMatch || idMatch;
        });
        setFilteredPokemonList(result);
    }
};

  useEffect(() => {
    let soundObject;
    async function startMusic() {
        const { sound } = await Audio.Sound.createAsync(
            require('./assets/pokeOpening.mp3')  
        );
        soundObject = sound;
        await soundObject.playAsync(); 
    }

    startMusic();

    return () => {
        if (soundObject) {
            soundObject.unloadAsync();
        }
    };
}, []);

useEffect(() => {
  fetch('https://pokeapi.co/api/v2/pokemon?limit=1000')
      .then(response => response.json())
      .then(async data => {
          // Fetch detailed data for each Pokemon
          const detailedDataPromises = data.results.map(pokemon => 
              fetch(pokemon.url).then(resp => resp.json())
          );
          const detailedData = await Promise.all(detailedDataPromises);
          setPokemonList(detailedData);
      })
      .catch(error => {
          console.log(error);
      });
}, []);



  useEffect(() => {
    fetch('https://pokeapi.co/api/v2/pokemon?limit=100')
      .then(response => response.json())
      .then(data => {
        setPokemonList(data.results);
      })
      .catch(error => {
        console.log(error);
      });
  }, []);

  const sortPokemonList = () => {
    const sortedList = [...pokemonList];
    sortedList.sort((a, b) => a.name.localeCompare(b.name));
    setSortedPokemonList(sortedList);
    setIsSorted(true);
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>POKEDEX</Text>
      <TextInput 
            style={styles.searchBar}
            value={searchText}
            onChangeText={text => handleSearch(text)}
            placeholder="Search for a Pokemon"
        />
      <View style={styles.buttonContainer}>
        <Pressable
          style={styles.button}
          onPress={sortPokemonList}
        >
          <Text style={styles.buttonText}>BY NAME</Text>
        </Pressable>
      </View>

      <View style={styles.pokiGridContainer}>
        {(filteredPokemonList.length > 0 ? filteredPokemonList : (isSorted ? sortedPokemonList : pokemonList)).map((item, index) => (
          <PokemonItem key={index} name={item.name} />
        ))}
      </View>

      <StatusBar style="auto" />
    </ScrollView>
  );
}

const PokemonItem = ({ name }) => {
  const [poki, setPoki] = useState(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isShiny, setIsShiny] = useState(false);

  useEffect(() => {
    fetch(`https://pokeapi.co/api/v2/pokemon/${name}`)
      .then(response => response.json())
      .then(data => {
        setPoki(data);
      })
      .catch(error => {
        console.log(error);
      });
  }, [name]);

  useEffect(() => {
    const shinyInterval = setInterval(() => {
      setIsShiny(prevShiny => !prevShiny);
    }, 2000);
    return () => clearInterval(shinyInterval);
  }, []);
  
  return (
    <View style={styles.pokiContainer}>
      {poki && (
        <>
          <View style={styles.pokiImageContainer}
             onMouseEnter={() => setIsHovered(true)}   
             onMouseLeave={() => setIsHovered(false)}>
            {poki.sprites && (
                 <>
                      <Image
                          source={{ uri: isHovered ? poki.sprites.back_default : poki.sprites.front_default }}
                          style={[styles.pokiImage, { opacity: isShiny ? 0 : 1 }]}
                     />
                      <Image
                          source={{ uri: isHovered ? poki.sprites.back_shiny : poki.sprites.front_shiny }}
                          style={[styles.pokiImage, { opacity: isShiny ? 1 : 0, position: 'absolute' }]}
                      />
                  </>
             )}
    </View>
          <View style={styles.pokiTextStyle}>
          <Text style={styles.pokiName}>{name}</Text>
          <Text style={styles.pokiId}>ID: {poki.id}</Text>
          <Text style={styles.pokiType}>Type: {poki.types[0].type.name}</Text>
          <Text style={styles.pokiHeight}>Taille: {poki.height / 10} m</Text>
          <Text style={styles.pokiWeight}>Poids: {poki.weight / 10} Kg</Text>
          <Text style={styles.pokiExp}>Exp: {poki.base_experience}</Text>
          </View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  title: {
    textAlign: 'center',
    color: '#ff2323',
    marginTop: 60,
    fontSize: 100,
    fontWeight: 'bold',
    opacity: 0.7
  },
  buttonContainer: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 10, 
  },
  button: {
    width: 200,
    height: 50,
    backgroundColor: '#ff2323',
    borderRadius: 10,
    justifyContent: 'center',
  },
  buttonText: {
    textAlign: 'center',
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  searchBar: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    margin: 10,
    padding: 5,
    fontSize: 16,
},
  pokiGridContainer: {
    marginTop: 10,
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-evenly',
  },
  pokiContainer: {
    padding: 10,
    margin: 10,
    borderRadius: 5,
    width: '45%',
    alignItems: 'center',
    backgroundColor: '#FFF0F5'
  },
  pokiImageContainer: {
    width:  0,
    height: 0,
    backgroundColor: '#FFF0F5',
    borderRadius: 0,
    justifyContent: 'start',
    alignItems: 'end',
  },
  pokiImage: {
    width: 200,
    height: 200,
    transition: 'opacity 0.3s ease',
  },
  pokiTextStyle: {
    justifyContent: 'flex',
    marginLeft: 100
  },
  pokiName: {
    fontSize: 30,
    fontWeight: 'bold',
    color: 'red',
  },
  pokiId: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'black',
  },
  pokiType: {
    fontSize: 20,
    color: 'black',
    fontWeight: 'bold',
  },
  pokiHeight: {
    fontSize: 20,
    color: 'black',
    fontWeight: 'bold',
  },
  pokiWeight: {
    fontSize: 20,
    color: 'black',
    fontWeight: 'bold',
  },
  pokiExp: {
    fontSize: 20,
    color: 'black',
    fontWeight: 'bold',
  },
});

 