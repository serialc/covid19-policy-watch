
library(rjson)

# get data and structure it

inf <- read.table('https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_confirmed_global.csv', header = T, sep=',', quote = "\"", stringsAsFactors = F)
dth <- read.table('https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_deaths_global.csv', header=T, sep=',', quote="\"", stringsAsFactors = F)
#rec <- read.table('https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_recovered_global.csv', header=T, sep=',', quote="\"", stringsAsFactors = F)

eu_countries <- c("Austria", "Belgium", "Bulgaria", "Croatia", "Cyprus", "Czechia", "Denmark", "Estonia", "Finland", "France",
                  "Germany", "Greece", "Hungary", "Ireland", "Italy", "Latvia", "Lithuania", "Luxembourg", "Malta", "Netherlands",
                  "Norway",  "Poland", "Portugal", "Romania", "Slovakia", "Slovenia", "Spain", "Sweden", "United Kingdom")

# only want countries in EU
euinf <- inf[inf$Country.Region %in% eu_countries,]
eudth <- dth[dth$Country.Region %in% eu_countries,]

# check for errors, missing data (want TRUE)
all(sort(unique(euinf$Country.Region)) == eu_countries)
all(sort(unique(eudth$Country.Region)) == eu_countries)

# collapse/sum by country
euinfcon <- lapply(split(euinf, euinf$Country.Region), function(x) {
  #x <- split(euinf, euinf$Country.Region)[[1]]
  y <- colSums(x[,5:ncol(x)])
  dt <- as.Date(x = names(y), format="X%m.%d.%j")
  dy <- c(0, diff(y))
  data.frame(date=strftime(dt, "%F"), sum=y, daily=dy, smth7=round(filter(dy, filter=rep(1/7, 7), sides=1)), row.names = NULL)[7:length(dy),]
  })
eudthcon <- lapply(split(eudth, eudth$Country.Region), function(x) {
  #x <- split(eudth, eudth$Country.Region)[[1]]
  y <- colSums(x[,5:ncol(x)])
  dt <- as.Date(x = names(y), format="X%m.%d.%j")
  dy <- c(0, diff(y))
  data.frame(date=strftime(dt, "%F"), sum=y, daily=dy, smth7=round(filter(dy, filter=rep(1/7, 7), sides=1)), row.names = NULL)[7:length(dy),]
})

full <- list(inf=euinfcon, dth=eudthcon)
     
write(toJSON(full), file = 'www/data/covid19_infdth.json')
