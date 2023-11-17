'use strict';

const btn = document.querySelector('.btn-country');
const countriesContainer = document.querySelector('.countries');

const renderError = function (msg) {
  countriesContainer.insertAdjacentText('beforeend', msg);
};

const getJSON = function (url, errorMsg = 'Something went wrong') {
  return fetch(url).then(response => {
    if (!response.ok) throw new Error(`${errorMsg} ${response.status}`);
    return response.json();
  });
};

const renderCountry = function (data, className = '') {
  const flagSrc =
    data.flags && (data.flags.png ? data.flags.png : data.flags.img);
  countriesContainer.style.opacity = 1;

  const html = `
    <article class="country ${className}" data-country-code="${data.cca3}">
      <img class="country__img" src="${flagSrc || ''}" />
      <div class="country__data">
        <h3 class="country__name">${
          data.name && data.name.common ? data.name.common : 'N/A'
        }</h3>
        <h4 class="country__region">${data.region || 'N/A'}</h4>
        <p class="country__row"><span>👫</span>${(
          +data.population / 1000000
        ).toFixed(1)} M</p>
        <p class="country__row"><span>🗣️</span>${
          data.languages ? Object.values(data.languages).join(', ') : 'N/A'
        }</p>
        <p class="country__row"><span>💰</span>${
          data.currencies
            ? Object.values(data.currencies)
                .map(curr => curr.name)
                .join(', ')
            : 'N/A'
        }</p>
      </div>
    </article>
  `;

  countriesContainer.insertAdjacentHTML('beforeend', html);

  // Add click event listener to the country article
  const countryArticle = countriesContainer.lastElementChild;
  countryArticle.addEventListener('click', function () {
    const countryCode = this.dataset.countryCode;
    getCountryAndNeighbours(countryCode);
  });
};

const getCountryAndNeighbours = function (countryCode) {
  // Clear the countries container before rendering new countries
  countriesContainer.innerHTML = '';

  getJSON(`https://restcountries.com/v3.1/alpha/${countryCode}`)
    .then(country => {
      // Render the clicked country
      renderCountry(country[0], 'clicked');

      // Get the neighbor country data
      const neighbours = country[0].borders || [];

      // Map each neighbour to a promise that fetches its data
      const neighbourPromises = neighbours.map(neighbour =>
        getJSON(`https://restcountries.com/v3.1/alpha/${neighbour}`)
      );

      // Use Promise.all to wait for all neighbor data to be fetched
      return Promise.all(neighbourPromises);
    })
    .then(neighbourDataArray => {
      // Render all the neighbor countries with the 'neighbour' class
      neighbourDataArray.forEach(neighbourData => {
        renderCountry(neighbourData[0], 'neighbour');
      });
    })
    .catch(error => {
      console.error('Error fetching country and neighbors:', error);
    });
};

const getPosition = function () {
  return new Promise(function (resolve, reject) {
    navigator.geolocation.getCurrentPosition(resolve, reject);
  });
};

btn.addEventListener('click', async function () {
  try {
    // Geolocation
    const pos = await getPosition();
    const { latitude: lat, longitude: lng } = pos.coords;

    // Reverse geocoding
    const resGeo = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`
    );
    if (!resGeo.ok) throw new Error('Problem getting location data');

    const dataGeo = await resGeo.json();

    // Call getCountryAndNeighbours with the country code
    getCountryAndNeighbours(dataGeo.countryCode);
  } catch (err) {
    console.error(err);
    renderError(`${err.message}`);
    // Reject promise returned from async function
    throw err;
  }
});

// const getCountryData = function (country) {
//   // Contry 1
//   getJSON(`https://restcountries.com/v3.1/name/${country}`, `Country not found`)
//     .then(data => {
//       renderCountry(data[0]);

//       const neighbour = data[0].borders?.[0];
//       if (!neighbour) throw new Error(`No neighbour found!`);

//       if (neighbour) {
//         return getJSON(
//           `https://restcountries.com/v3.1/alpha/${neighbour}`,
//           `Country not found `
//         );
//       }
//     })
//     .then(data => data && renderCountry(data[0], 'neighbour'))
//     .catch(err => {
//       console.error(`${err} 💥💥💥`);
//       renderError(`Something went wrong 💥 ${err.message}. Try again!`);
//     })
//     .finally(() => {
//       countriesContainer.style.opacity = 1;
//     });
// };

/* const whereAmI = function () {
  if ('geolocation' in navigator) {
    navigator.geolocation.getCurrentPosition(position => {
      const { latitude: lat, longitude: lng } = position.coords;

      // Use the obtained coordinates to fetch location details
      fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`
      )
        .then(response => response.json())
        .then(data => {
          console.log(data);
          const city = data.city;
          const country = data.countryName;
          const countryCode = data.countryCode;

          console.log(`You are in ${city}, ${country}`);

          return countryCode;
        })
        .then(countryCode => {
          // Add return here to chain the promise
          return getJSON(`https://restcountries.com/v3.1/alpha/${countryCode}`);
        })
        .then(countries => {
          const country = countries[0];
          // Render the main country
          renderCountry(country);
          // Get the neighbor country data
          const neighbours = country.borders || [];
          const neighbourPromises = neighbours.map(neighbour =>
            getJSON(`https://restcountries.com/v3.1/alpha/${neighbour}`)
          );
          return Promise.all(neighbourPromises);
        })
        .then(neighbourDataArray => {
          // Render all the neighbor countries with the 'neighbour' class
          neighbourDataArray.forEach(neighbourData => {
            renderCountry(neighbourData[0], 'neighbour');
          });
        })
        .catch(error => {
          console.error('Error fetching location details:', error);
        })
        .finally(() => {
          countriesContainer.style.opacity = 1;
        });
    });
  } else {
    console.error('Geolocation is not supported by your browser');
  }
}; */

///////////////////////////////////////
/// https://countries-api-836d.onrender.com/countries/
// https://restcountries.eu/rest/v2/name/${country}`

// const getCountryData = function (country, callback) {
//   const request = new XMLHttpRequest();
//   request.open('GET', `https://restcountries.com/v3.1/name/${country}`);
//   request.send();

//   request.addEventListener('load', function () {
//     const [data] = JSON.parse(this.responseText);
//     if (data) {
//       callback(null, data);
//     } else {
//       callback(`Country not found: ${country}`, null);
//     }
//   });
// };

// const getNeighbourData = function (neighbour, callback) {
//   getCountryData(neighbour, callback);
// };

// const getCountryAndNeighbour = function (country) {
//   // Get main country data
//   getCountryData(country, function (error, countryData) {
//     if (error) {
//       console.error(error);
//       return;
//     }

//     // Render main country
//     renderCountry(countryData);

//     // Get neighbour country data
//     const neighbour = countryData.borders?.[0];
//     if (neighbour) {
//       getNeighbourData(neighbour, function (error, neighbourData) {
//         if (error) {
//           console.error(error);
//           return;
//         }

//         // Render neighbour country
//         renderCountry(neighbourData, 'neighbour');
//       });
//     }
//   });
// };

// getCountryAndNeighbour('sakartvelo');
// getCountryAndNeighbour('portugal');
// getCountryAndNeighbour('spain');
// getCountryAndNeighbour('usa');

// const request = fetch('https://restcountries.com/v3.1/name/sakartvelo');
// console.log(request);

// const getCountryData = function (country) {
//   fetch(`https://restcountries.com/v3.1/name/${country}`)
//     .then(function (response) {
//       console.log(response);
//       return response.json();
//     })
//     .then(function (data) {
//       console.log(data);
//       renderCountry(data[0]);
//     });
// };
// getCountryData('sakartvelo');

/* const getCountryData = function (country) {
  fetch(`https://restcountries.com/v3.1/name/${country}`)
    .then(response => {
      // Country 1
      if (!response.ok) throw new Error(`Country not found ${response.status}`);

      console.log(response);

      return response.json();
    })
    .then(data => {
      renderCountry(data[0]);

      // const neighbour = data[0].borders?.[0];
      const neighbour = 'asdasdadsa';
      if (!neighbour) return;

      if (neighbour) {
        return fetch(`https://restcountries.com/v3.1/alpha/${neighbour}`);
      }
    })
    .then(response => {
      if (!response.ok) throw new Error(`Country not found ${response.status}`);
      return response ? response.json() : null;
    })
    .then(data => data && renderCountry(data[0], 'neighbour'))
    .catch(err => {
      console.error(`${err} 💥💥💥`);
      renderError(`Something went wrong 💥 ${err.message}. Try again!`);
    })
    .finally(() => {
      countriesContainer.style.opacity = 1;
    });
}; */

// console.log('test start');
// setTimeout(() => console.log('0 sec timer'), 0);
// Promise.resolve('Resolved promise 1').then(res => console.log(res));
// console.log('test end');

/* const lottoryPromise = new Promise(function (resolve, reject) {
  console.log('lotter draw is happening');
  setTimeout(function () {
    if (Math.random() >= 0.5) {
      resolve('You WIN 💰');
    } else {
      reject(new Error('You lost your money 💥'));
    }
  }, 2000);
});

lottoryPromise.then(res => console.log(res)).catch(err => console.error(err));

// Promisifying setTimeout
const wait = function (seconds) {
  return new Promise(function (resolve) {
    setTimeout(resolve, seconds * 1000);
  });
};

wait(2)
  .then(() => {
    console.log('I waited for 2 seconds');
    return wait(1);
  })
  .then(() => console.log('I waited for 1 second'));

Promise.resolve('abcs').then(x => console.log(x));
Promise.reject('problem!').catch(x => console.error(x));
 */

// const getPosition = function () {
//   return new Promise(function (resolve, reject) {
//     navigator.geolocation.getCurrentPosition(resolve, reject);
//   });
// };

// getPosition().then(pos => console.log(pos));

// const whereAmI = function () {
//   if ('geolocation' in navigator) {
//     getPosition()
//       .then(pos => {
//         const { latitude: lat, longitude: lng } = pos.coords;

//         return fetch(
//           `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`
//         );
//       })
//       .then(response => response.json())
//       .then(data => {
//         console.log(data);
//         const city = data.city;
//         const country = data.countryName;
//         const countryCode = data.countryCode;

//         console.log(`You are in ${city}, ${country}`);

//         return countryCode;
//       })
//       .then(countryCode => {
//         // Add return here to chain the promise
//         return getJSON(`https://restcountries.com/v3.1/alpha/${countryCode}`);
//       })
//       .then(countries => {
//         const country = countries[0];
//         // Render the main country
//         renderCountry(country);
//         console.log(country);
//         // Get the neighbor country data
//         const neighbours = country.borders || [];
//         console.log(neighbours);
//         const neighbourPromises = neighbours.map(neighbour =>
//           getJSON(`https://restcountries.com/v3.1/alpha/${neighbour}`)
//         );
//         return Promise.all(neighbourPromises);
//       })
//       .then(neighbourDataArray => {
//         // Render all the neighbor countries with the 'neighbour' class
//         neighbourDataArray.forEach(neighbourData => {
//           renderCountry(neighbourData[0], 'neighbour');
//         });
//       })
//       .catch(error => {
//         console.error('Error fetching location details:', error);
//       })
//       .finally(() => {
//         countriesContainer.style.opacity = 1;
//       });
//   } else {
//     console.error('Geolocation is not supported by your browser');
//   }
// };

// btn.addEventListener('click', whereAmI);

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////SWITCHING PHOTOS EVERY 2s////////////////SEC///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/* const wait = function (seconds) {
  return new Promise(function (resolve) {
    setTimeout(resolve, seconds * 1000);
  });
};

const imgContainer = document.querySelector('.images');

const createImage = function (imagePath) {
  return new Promise(function (resolve, reject) {
    const img = document.createElement('img');
    img.src = imagePath;

    img.addEventListener('load', function () {
      imgContainer.append(img);
      resolve(img);
    });

    img.addEventListener('error', function () {
      reject(new Error('Image not found'));
    });
  });
};

let currentImg;

createImage('img/img-1.jpg')
  .then(img => {
    currentImg = img;
    console.log('image 1 loaded');
    return wait(2);
  })
  .then(() => {
    currentImg.style.display = 'none';
    return createImage('img/img-2.jpg');
  })
  .then(img => {
    currentImg = img;
    console.log('image 2 loaded');
    return wait(2);
  })
  .then(() => {
    currentImg.style.display = 'none';
    console.log('image 3 loaded');
    return Promise.all([createImage('img/img-3.jpg'), wait(2)]);
  })
  .then(([img]) => {
    currentImg = img;
    currentImg.style.display = 'none';
  })
  .catch(err => console.error(err)); */

// (async function () {
//   try {
//     const city = await whereAmI();
//     console.log(`2: ${city}`);
//   } catch (err) {
//     console.log(`3: finished getting location`);
//   }
// })();

// const city = await whereAmI();
// console.log(`2: ${city}`);

/* const get3Countries = async function (c1, c2, c3) {
  try {
    // const data1 = await getJSON(`https://restcountries.com/v3.1/name/${c1}`);
    // const data2 = await getJSON(`https://restcountries.com/v3.1/name/${c2}`);
    // const data3 = await getJSON(`https://restcountries.com/v3.1/name/${c3}`);
    // console.log([data1[0].capital, data2[0].capital, data3[0].capital]);

    const data = await Promise.all([
      getJSON(`https://restcountries.com/v3.1/name/${c1}`),
      getJSON(`https://restcountries.com/v3.1/name/${c2}`),
      getJSON(`https://restcountries.com/v3.1/name/${c3}`),
    ]);
    console.log(data.map(d => d[0].capital));
  } catch (err) {
    console.log(err);
  }
};

get3Countries('sakartvelo', 'portugal', 'spain');
 */

// Promise.race
// (async function () {
//   const res = await Promise.race([
//     getJSON(`https://restcountries.com/v3.1/name/italy`),
//     getJSON(`https://restcountries.com/v3.1/name/egipt`),
//     getJSON(`https://restcountries.com/v3.1/name/brazil`),
//   ]);
//   console.log(res[0]);
// })();
/* 
const timeout = function (sec) {
  return new Promise(function (_, reject) {
    setTimeout(function () {
      reject(new Error('Request took too long!'));
    }, sec * 1000);
  });
};

Promise.race([
  getJSON(`https://restcountries.com/v3.1/name/mexico`),
  timeout(1),
])
  .then(res => console.log(res[0]))
  .catch(err => console.error(err));

// Promise.allSettled

Promise.any([
  Promise.resolve('Success'),
  Promise.reject('b'),
  Promise.resolve('c'),
])
  .then(res => console.log(res))
  .catch(err => console.error(err));
 */

/* 
PART 1
Write an async function 'loadNPause' that recreates Coding Challenge #2, this time using async/await (only the part where the promise is consumed). Compare the two versions, think about the big differences, and see which one you like more.
Don't forget to test the error handler, and to set the network speed to 'Fast 3G' in the dev tools Network tab.

PART 2
1. Create an async function 'loadAll' that receives an array of image paths 'imgArr';
2. Use .map to loop over the array, to load all the images with the 'createImage' function (call the resulting array 'imgs')
3. Check out the 'imgs' array in the console! Is it like you expected?
4. Use a promise combinator function to actually get the images from the array 😉
5. Add the 'paralell' class to all the images (it has some CSS styles).

TEST DATA: ['img/img-1.jpg', 'img/img-2.jpg', 'img/img-3.jpg']. To test, turn off the 'loadNPause' function.

GOOD LUCK 😀
*/
// const wait = async function (seconds) {
//   return await function (resolve) {
//     setTimeout(resolve, seconds * 1000);
//   };
// };
/* const imgContainer = document.querySelector('.images');

const wait = async function (seconds) {
  return new Promise(resolve => {
    setTimeout(resolve, seconds * 1000);
  });
};

const loadNPause = async function (imagePath, paused) {
  try {
    const img = await createImage(imagePath);

    await wait(paused);

    img.style.display = 'none';
    img.classList.add('paralell'); // Add the 'parallel' class to the image
  } catch (err) {
    console.error(err);
  }
};

const createImage = async function (imagePath) {
  return new Promise(function (resolve, reject) {
    const img = document.createElement('img');
    img.src = imagePath;

    img.addEventListener('load', function () {
      imgContainer.append(img);
      resolve(img);
    });

    img.addEventListener('error', function () {
      reject(new Error('Image not found'));
    });
  });
};

const loadAll = async function (imgArr) {
  try {
    const imgs = await Promise.all(
      imgArr.map(imgPath => loadNPause(imgPath, 2))
    );
    return imgs;
  } catch (err) {
    console.error(err);
  }
};

const allImage = ['img/img-1.jpg', 'img/img-2.jpg', 'img/img-3.jpg'];

// Example usage
loadAll(allImage).then(imgs => {
  // imgs is an array of loaded images
  console.log('All images loaded:', imgs);
  console.log(
    'Images with "parallel" class:',
    document.querySelectorAll('.parallel')
  );
}); */
