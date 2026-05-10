<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="200" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://coveralls.io/github/nestjs/nest?branch=master" target="_blank"><img src="https://coveralls.io/repos/github/nestjs/nest/badge.svg?branch=master#9" alt="Coverage" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Database Architecture

Below is the entity-relationship diagram representing the core data structure of the Sullerk platform.

```mermaid
erDiagram
    User {
        String id PK
        String username
        String email UK
        Role role
        Status status
    }
    Admin {
        String id PK
        String userId FK
        String fullName
    }
    Customer {
        String id PK
        String userId FK
        String fullName
        Float balance
    }
    
    %% Marketplace
    Listing {
        String id PK
        String ownerId FK
        String sport
        String category
        Float initialPrice
        ListingStatus status
    }
    Order {
        String id PK
        String orderNumber UK
        String listingId FK
        String buyerId FK
        String sellerId FK
        Float totalAmount
        OrderStatus status
    }
    ExchangeOffer {
        String id PK
        String senderId FK
        String receiverId FK
        ExchangeStatus status
        Float balanceToPay
    }
    Deal {
        String id PK
        String buyerId FK
        String sellerId FK
        DealStatus status
    }

    %% Social & Content
    Post {
        String id PK
        String customerId FK
        String description
    }
    Comment {
        String id PK
        String postId FK
        String customerId FK
        String body
    }
    Community {
        String id PK
        String name
        CommunityType type
    }
    CommunityMember {
        String id PK
        String customerId FK
        String communityId FK
        CommunityUserType userType
    }
    CommunityPost {
        String id PK
        String customerId FK
        String communityId FK
    }

    %% Price Engine
    PriceEngineConfig {
        String id PK
        String sport UK
        Float platformFeePercent
        Boolean isActive
    }
    BaseValue {
        String id PK
        String configId FK
        Float basePrice
    }
    Multipliers {
        String id PK
        String configId FK
        Float multiplier
    }
    PriceCalculationLog {
        String id PK
        String listingId FK
        Float finalPrice
    }

    %% Relationships
    User ||--|| Admin : "manages"
    User ||--|| Customer : "profile"
    Admin ||--o{ Dispute : "resolves"
    Customer ||--o{ Post : "authors"
    Customer ||--o{ Listing : "owns"
    Customer ||--o{ Order : "buys/sells"
    Customer ||--o{ ExchangeOffer : "sends/receives"
    Customer ||--o{ Deal : "participates"
    Customer ||--o{ CommunityMember : "belongs to"
    
    Listing ||--o{ Order : "sold via"
    Listing ||--o{ ExchangeOffer : "traded via"
    Listing ||--o{ PriceCalculationLog : "audit trail"
    
    Order ||--o{ Dispute : "has"
    Post ||--o{ Comment : "has"
    
    Community ||--o{ CommunityMember : "contains"
    Community ||--o{ CommunityPost : "hosts"
    
    PriceEngineConfig ||--o{ BaseValue : "defines"
    PriceEngineConfig ||--o{ Multipliers : "rules"
    PriceEngineConfig ||--o{ Listing : "prices"
```


## Installation

```bash
$ npm install
```

## Running the app

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Test

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://kamilmysliwiec.com)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](LICENSE).



### Digitalboab