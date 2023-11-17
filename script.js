'use strict';

const btn = document.querySelector('.btn-country');
const countriesContainer = document.querySelector('.countries');

const renderError = function (msg) {
  countriesContainer.insertAdjacentText('beforeend', msg);
  // countriesContainer.style.opacity = 1;
};
const getJSON = function (url, errorMsg = 'Somthing went wrong') {
  return fetch(url).then(response => {
    if (!response.ok) throw new Error(`${errorMsg} ${response.status}`);
    return response ? response.json() : null;
  });
};

const getCountryData = function (country) {
  // Contry 1
  getJSON(`https://restcountries.com/v3.1/name/${country}`, `Country not found`)
    .then(data => {
      renderCountry(data[0]);

      const neighbour = data[0].borders?.[0];
      if (!neighbour) throw new Error(`No neighbour found!`);

      if (neighbour) {
        return getJSON(
          `https://restcountries.com/v3.1/alpha/${neighbour}`,
          `Country not found `
        );
      }
    })
    .then(data => data && renderCountry(data[0], 'neighbour'))
    .catch(err => {
      console.error(`${err} 💥💥💥`);
      renderError(`Something went wrong 💥 ${err.message}. Try again!`);
    })
    .finally(() => {
      countriesContainer.style.opacity = 1;
    });
};

const whereAmI = function () {
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
};
const renderCountry = function (data, className = '') {
  const flagSrc =
    data.flags && (data.flags.png ? data.flags.png : data.flags.img);

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

btn.addEventListener('click', function () {
  whereAmI();
});

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
