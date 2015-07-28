[![Built with Grunt](https://cdn.gruntjs.com/builtwith.png)](http://gruntjs.com/) [![devDependency Status](https://david-dm.org/gormus/multisite/dev-status.svg)](https://david-dm.org/gormus/multisite#info=devDependencies) 

# Multiple Drupal 7 Websites with a shared core
This is a hybrid solution for the Drupal's multisite installation.

## What is Drupal Multisite?
A "[multi-site](https://www.drupal.org/documentation/install/multi-site)" allows you to run many sites from a single codebase. The idea is that you can update the codebase once and automatically apply those changes to all your site. In theory, it's a great idea. In practice, it often causes more problems than it solves.

The most obvious problem of running a lot of sites on one codebase is that any one of them could face a traffic spike, and negatively impact all the others. If you're looking to serve a large volume of sites, the risk becomes non-trivial that one site's "best day ever" is the other 99's worst.

One syntax error, and all the sites go down.

Updating the codebase would require running update scripts for all the websites nevertheless. There's also the reality that some upgrades may not go smoothly.

Adding or modifying codebase for a specific website may effect other websites within the multi-site environment. Code-freeze and/or content-freeze might be needed for rest of the websites.

Configuring content access rules are more complicated and restrictive. Also, changing the behavior at a later stage is often more restrictive and troublesome. Similar hurdles also present for the users managing the content for the websites. Especially when moderation logic is part of the content administration.

Multi-site environments are not supported by all hosting platforms. Pantheon.io which hosts most of our Drupal projects, is one of them. Pantheon argues why multi-site configuration is not good. 

Why Drupal Multisite Is Not Enterprise Grade
https://pantheon.io/blog/why-drupal-multisite-not-enterprise-grade

Drupal Multisite: Much Ado About Drupal Multisite
https://pantheon.io/blog/drupal-multisite-much-ado-about-drupal-multisite

[Acquia](http://www.acquia.com) on the other hand, is the company founded by the creator of Drupal CMS, Dries Buytaert. And Acquia, offers 3-tier environment similar to [Pantheon](https://pantheon.io) development, staging and production. On the contrast to Pantheon, Acquia supports multi-site configuration and promotes it as a selling point. See attached PDF document offered by Acquia for details.

In our experience, multi-site configuration speeds up development in early stages. However, once the sites need unique features which would not be shared with others, complications starts. Maintaining, the sites, the content and the users becomes more challenging as the web sites grow.

## The Hybrid Solution
This project uses a single Drupal core and single shared ```sites/all``` directory to manage multiple websites by utilizing [Grunt](http://gruntjs.com/) task runner.

As for the Drupal core, Pantheon's [drop-7](https://github.com/pantheon-systems/drops-7) could be used as a Git sub-module.

## Installation

```bash
# Clone project from Github.
git clone git@github.com:gormus/multisite.git my_multisite_project
cd my_multisite_project
# Install grunt-cli globally.
npm install -g grunt-cli
# Install project locallyin current directory.
npm install
# Add Drupal as a git submodule. See config.path.drupal_core in config.json for the desired Drupal core directory.
git submodule add git@github.com:pantheon-systems/drops-7.git drupal_core
```

### Available Commands and Examples

#### Create a new website in development environment.
```grunt new:example.com```

#### Update an existing website in development environment.
```grunt update:example.com```

#### Update all existing websites in development environment.
```grunt update:all```

#### Stage the website on staging environment.
```grunt stage:example.com```

#### Deploy the website on production environment.
```grunt deploy:example.com```

#### Clone a website from one environment to another.
```grunt clone:example.com --source=[development|staging|production] --target=[development|staging|production]```

#### Create a compressed backup file.
``` grunt backup:example.com --env=[development|staging|production] ```

#### Empty a website on target environment.
``` grunt empty:example.com --env=[development|staging|production] ```

#### How to use Drush aliases?
The Gruntfile.js can generate a site-aliases file to be used with Drush: _aliases.drushrc.php_. 
```
grunt create-site-aliases
grunt update-site-aliases
```

To access the dynamically generated aliases include ```--alias-path=.``` argument in the drush command.
```
drush --alias-path=. @dev.example.com status
drush --alias-path=. @dev.example.com cache-clear all
```

### To-Do
Add these features:

##### Update Drupal core from Pantheon drop-7
grunt drupal:update
```
git pull origin/master
git submodule update
```

##### Additional configuration for settings.php
```php
/**
 * File system.
 */
$conf['file_default_scheme'] = 'public';
$conf['file_temporary_path'] = '/Applications/MAMP/tmp/php';
$conf['file_public_path']    = 'sites/example.dev/public_files';
$conf['file_private_path']   = 'sites/example.dev/private_files';

/**
 * Regional settings.
 */
$conf['site_default_country'] = 'US';
$conf['date_default_timezone'] = 'America/Los_Angeles';

/**
 * Account settings.
 */
$conf['user_register'] = '0';
$conf['user_pictures'] = 0;
$conf['user_signatures'] = 0;
```
