'use strict';

var container = document.getElementById( 'error_box' );

if( container )
{
	var link = document.createElement( 'a' );
	link.rel = 'noopener';
	link.className = 'steamdb_error_link';
	link.href = GetHomepage() + 'app/' + GetCurrentAppID() + '/?utm_source=Steam&utm_medium=Steam&utm_campaign=SteamDB%20Extension';
	link.appendChild( document.createTextNode( 'View on Steam Database' ) );

	container.appendChild( link );
}
else
{
	GetOption( {
		'button-app': true,
		'button-pcgw': true,
		'link-subid': true,
		'online-stats': true,
		'steamdb-lowest-price': true,
		'steamdb-rating': true,
		'steamdb-last-update': true,
	}, function( items )
	{
		var link, element, image, container;

		if( items[ 'online-stats' ] && !document.querySelector( '.game_area_dlc_bubble' ) )
		{
			DrawOnlineStatsWidget( items );
		}

		if( items[ 'steamdb-lowest-price' ] )
		{
			let country = null;
			let currency = document.querySelector( 'meta[itemprop="priceCurrency"]' );
			currency = currency ? currency.content : null;

			if( !currency )
			{
				currency = 'USD';

				WriteLog( 'Missing priceCurrency, forced to USD' );
			}
			else if( currency === 'USD' )
			{
				// We only need to know the country if currency is USD
				// as all other currencies are uniquely mapped already
				const script = document.evaluate( '//script[contains(text(), "EnableSearchSuggestions")]', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null ).singleNodeValue;

				if( script )
				{
					const result = script.textContent.match( /EnableSearchSuggestions\(.+?'([A-Z]{2})',/ );

					if( result )
					{
						country = result[ 1 ].toLowerCase();
					}
				}

				if( !country )
				{
					country = document.cookie.match( /steamCountry=([a-z]{2})/i );
					country = country === null ? 'us' : country[ 1 ].toLowerCase();

					WriteLog( `Matched country as "${country}" from cookie and currency as "${currency}"` );
				}
				else
				{
					WriteLog( `Matched country as "${country}" from search script and currency as "${currency}"` );
				}
			}
			else
			{
				WriteLog( `Matched currency as "${currency}"` );
			}

			SendMessageToBackgroundScript( {
				contentScriptQuery: 'GetPrice',
				appid: GetCurrentAppID(),
				currency: currency,
				country: country,
			}, ( response ) =>
			{
				if( !response || !response.success )
				{
					WriteLog( 'GetPrice failed to load' );

					return;
				}

				const data = response.data;

				if( !data.lowest )
				{
					WriteLog( 'GetPrice has no lowest' );

					return;
				}

				WriteLog( 'GetPrice loaded' );

				link = document.createElement( 'a' );
				link.rel = 'noopener';
				link.href = GetHomepage() + 'app/' + GetCurrentAppID() + '/?utm_source=Steam&utm_medium=Steam&utm_campaign=SteamDB%20Lowest%20Price';
				link.appendChild( document.createTextNode( 'SteamDB lowest recorded price is ' ) );

				element = document.createElement( 'b' );
				element.textContent = data.lowest.price;
				link.appendChild( element );

				if( data.lowest.discount > 0 )
				{
					link.appendChild( document.createTextNode( ' at ' ) );

					element = document.createElement( 'b' );
					element.textContent = `-${data.lowest.discount}%`;
					link.appendChild( element );
				}

				link.appendChild( document.createTextNode( ` on ${data.lowest.date}` ) );

				element = document.createElement( 'div' );
				element.className = 'steamdb_prices';

				image = document.createElement( 'img' );
				image.src = GetLocalResource( 'icons/white.svg' );
				element.appendChild( image );
				element.appendChild( link );

				container = document.getElementById( 'game_area_purchase' );
				container.insertAdjacentElement( 'beforeBegin', element );
			} );
		}

		if( items[ 'button-app' ] )
		{
			container = document.querySelector( '.apphub_OtherSiteInfo' );

			if( container )
			{
				link = document.createElement( 'a' );
				link.rel = 'noopener';
				link.className = 'btnv6_blue_hoverfade btn_medium btn_steamdb';
				link.href = GetHomepage() + 'app/' + GetCurrentAppID() + '/?utm_source=Steam&utm_medium=Steam&utm_campaign=SteamDB%20Extension';

				element = document.createElement( 'span' );
				element.dataset.tooltipText = 'View on Steam Database';
				link.appendChild( element );

				image = document.createElement( 'img' );
				image.className = 'ico16';
				image.src = GetLocalResource( 'icons/white.svg' );

				element.appendChild( image );

				container.insertBefore( link, container.firstChild );
			}
		}

		if( items[ 'button-pcgw' ] )
		{
			container = document.querySelector( '.apphub_OtherSiteInfo' );

			if( container )
			{
				link = document.createElement( 'a' );
				link.rel = 'noopener';
				link.className = 'btnv6_blue_hoverfade btn_medium btn_steamdb';
				link.href = 'https://pcgamingwiki.com/api/appid.php?appid=' + GetCurrentAppID() + '&utm_source=Steam&utm_medium=Steam&utm_campaign=SteamDB%20Extension';

				element = document.createElement( 'span' );
				element.dataset.tooltipText = 'View article on PCGamingWiki';
				link.appendChild( element );

				image = document.createElement( 'img' );
				image.className = 'ico16';
				image.src = GetLocalResource( 'icons/pcgamingwiki.svg' );

				element.appendChild( image );

				container.insertBefore( link, container.firstChild );

				// Best hacks EU
				container.insertBefore( document.createTextNode( ' ' ), link.nextSibling );
			}
		}

		if( items[ 'link-subid' ] )
		{
			// Find each "add to cart" button
			container = document.querySelectorAll( 'input[name="subid"]' );

			var hasDropdowns = false;
			var i = 0;
			var subid = 0;
			var subidElement;

			for( i = 0; i < container.length; i++ )
			{
				element = container[ i ];

				subid = element.value;

				element = element.parentElement.parentElement;

				subidElement = document.createElement( 'span' );
				subidElement.className = 'steamdb_subid';
				subidElement.dataset.tooltipText = 'View on Steam Database';

				link = document.createElement( 'a' );
				link.rel = 'noopener';
				link.className = 'btn_black btn_small steamdb_link';
				link.appendChild( subidElement );

				// Is this a subscription selector?
				if( subid.length > 0 )
				{
					subidElement.textContent = 'Sub ' + subid;
					link.href = GetHomepage() + 'sub/' + subid + '/?utm_source=Steam&utm_medium=Steam&utm_campaign=SteamDB%20Extension';
					link.appendChild( subidElement );

					if( element.className === 'game_purchase_action_bg' ) // series episode
					{
						element = element.parentElement;
					}
					else
					{
						element = element.querySelector( '.game_purchase_action' );
					}

					if( element )
					{
						element.appendChild( link );
					}
				}
				else if( element.querySelector( '.game_area_purchase_game_dropdown_selection' ) )
				{
					hasDropdowns = true;

					subidElement.textContent = 'nothing selected';
					link.href = '#';

					element.appendChild( link );
				}
			}

			container = document.querySelectorAll( 'input[name="bundleid"]' );

			for( i = 0; i < container.length; i++ )
			{
				element = container[ i ];

				subid = element.value;

				element = element.parentElement.parentElement;

				subidElement = document.createElement( 'span' );
				subidElement.dataset.tooltipText = 'View on Steam Database';

				link = document.createElement( 'a' );
				link.rel = 'noopener';
				link.className = 'btn_black btn_small steamdb_link';
				link.appendChild( subidElement );

				subidElement.textContent = 'Bundle ' + subid;
				link.href = GetHomepage() + 'bundle/' + subid + '/?utm_source=Steam&utm_medium=Steam&utm_campaign=SteamDB%20Extension';
				link.appendChild( subidElement );

				element.querySelector( '.game_purchase_action' ).appendChild( link );
			}

			// We have to inject our JS directly into the page to hook Steam's functionatily
			if( hasDropdowns )
			{
				element = document.createElement( 'script' );
				element.id = 'steamdb_subscriptions_hook';
				element.type = 'text/javascript';
				element.src = GetLocalResource( 'scripts/store/subscriptions.js' );
				element.dataset.homepage = GetHomepage();

				document.head.appendChild( element );
			}
		}

		if( items[ 'steamdb-rating' ] )
		{
			const positiveVoteText = document.querySelector( 'label[for="review_type_positive"] .user_reviews_count' );
			const negativeVoteText = document.querySelector( 'label[for="review_type_negative"] .user_reviews_count' );

			if( positiveVoteText && negativeVoteText )
			{
				const positiveVotes = parseInt( positiveVoteText.textContent.replace( /[(.,)]/g, '' ), 10 );
				const totalVotes = positiveVotes + parseInt( negativeVoteText.textContent.replace( /[(.,)]/g, '' ), 10 );
				const average = positiveVotes / totalVotes;
				const score = average - ( average - 0.5 ) * Math.pow( 2, -Math.log10( totalVotes + 1 ) );

				let ratingClass = 'poor';

				if( totalVotes < 500 )
				{
					ratingClass = 'white';
				}
				else if( score > 0.74 )
				{
					ratingClass = 'good';
				}
				else if( score > 0.49 )
				{
					ratingClass = 'average';
				}

				const container = document.createElement( 'div' );
				container.className = 'user_reviews_summary_row';

				const subtitle = document.createElement( 'div' );
				subtitle.className = 'subtitle column';
				subtitle.textContent = 'SteamDB Rating:';

				const summary = document.createElement( 'div' );
				summary.className = `summary column steamdb_rating steamdb_rating_${ratingClass}`;
				summary.textContent = ( score * 100 ).toFixed( 2 ) + '% ';

				const link = document.createElement( 'a' );
				link.rel = 'noopener';
				link.href = 'https://steamdb.info/blog/steamdb-rating/?utm_source=Steam&utm_medium=Steam&utm_campaign=SteamDB%20Extension';
				link.textContent = '(?)';

				summary.appendChild( link );
				container.appendChild( subtitle );
				container.appendChild( summary );

				let element = document.querySelectorAll( '.user_reviews_summary_row' );
				element = element[ element.length - 1 ];

				if( element )
				{
					element.parentNode.insertBefore( container, element.nextSibling );
				}
			}
		}
	} );
}

function DrawOnlineStatsWidget( items )
{
	const container = document.querySelector( '.game_meta_data' );

	if( !container )
	{
		return;
	}

	const blockInner = document.createElement( 'div' );
	blockInner.className = 'block_content_inner';

	const block = document.createElement( 'div' );
	block.className = 'block responsive_apppage_details_right steamdb_stats';
	block.appendChild( blockInner );

	container.insertBefore( block, container.firstChild );

	// Logo and link
	const link = document.createElement( 'a' );
	link.className = 'steamdb_stats_logo';
	link.rel = 'noopener';
	link.title = 'View more information and charts on SteamDB';
	link.href = GetHomepage() + 'app/' + GetCurrentAppID() + '/graphs/?utm_source=Steam&utm_medium=Steam&utm_campaign=SteamDB%20Extension';

	const image = document.createElement( 'img' );
	image.src = GetLocalResource( 'icons/white.svg' );
	link.appendChild( image );

	blockInner.appendChild( link );

	// Online now
	const onlineNow = document.createElement( 'b' );
	onlineNow.textContent = '…';

	let line = document.createElement( 'p' );
	let lineText = document.createElement( 'span' );
	lineText.textContent = 'Online now:';
	line.appendChild( lineText );
	line.appendChild( onlineNow );

	blockInner.appendChild( line );

	// Peak today
	const peakToday = document.createElement( 'b' );
	peakToday.textContent = '…';

	line = document.createElement( 'p' );
	lineText = document.createElement( 'span' );
	lineText.textContent = 'Peak today:';
	line.appendChild( lineText );
	line.appendChild( peakToday );

	blockInner.appendChild( line );

	// Peak all
	const peakAll = document.createElement( 'b' );
	peakAll.textContent = '…';

	line = document.createElement( 'p' );
	lineText = document.createElement( 'span' );
	lineText.textContent = 'All-time peak:';
	line.appendChild( lineText );
	line.appendChild( peakAll );

	blockInner.appendChild( line );

	// Followers
	const followers = document.createElement( 'b' );
	followers.textContent = '…';

	line = document.createElement( 'p' );
	lineText = document.createElement( 'span' );
	lineText.textContent = 'Followers:';
	line.appendChild( lineText );
	line.appendChild( followers );

	blockInner.appendChild( line );

	SendMessageToBackgroundScript( {
		contentScriptQuery: 'GetCurrentPlayers',
		appid: GetCurrentAppID(),
	}, ( response ) =>
	{
		if( !response || !response.success )
		{
			WriteLog( 'GetCurrentPlayers failed to load' );

			block.remove();

			return;
		}

		WriteLog( 'GetCurrentPlayers loaded' );

		const FormatNumber = ( num ) => num.toString().replace( /\B(?=(\d{3})+(?!\d))/g, ',' );

		onlineNow.textContent = FormatNumber( response.data.CurrentPlayers );
		peakToday.textContent = FormatNumber( response.data.MaxDailyPlayers );
		peakAll.textContent = FormatNumber( response.data.MaxPlayers );

		if( response.data.Followers > 0 )
		{
			followers.textContent = FormatNumber( response.data.Followers );
		}
		else
		{
			followers.parentNode.remove();
		}

		if( items[ 'steamdb-last-update' ] && response.data.LastDepotUpdate )
		{
			const depotsUpdate = document.createElement( 'div' );
			depotsUpdate.className = 'dev_row steamdb_last_update';
			depotsUpdate.title = 'As seen by Steam Database';

			const historyLink = document.createElement( 'a' );
			historyLink.rel = 'noopener';
			historyLink.className = 'date';

			if( response.data.WarnOldUpdate )
			{
				historyLink.className = 'steamdb_last_update_old';
			}

			historyLink.href = GetHomepage() + 'app/' + GetCurrentAppID() + '/history/?utm_source=Steam&utm_medium=Steam&utm_campaign=SteamDB%20Extension';
			historyLink.textContent = response.data.LastDepotUpdate;

			const subtitle = document.createElement( 'div' );
			subtitle.className = 'subtitle column';
			subtitle.textContent = 'Depots Update:';

			depotsUpdate.appendChild( subtitle );
			depotsUpdate.appendChild( historyLink );

			const releaseDate = document.querySelector( '.release_date' );

			if( releaseDate )
			{
				releaseDate.parentNode.insertBefore( depotsUpdate, releaseDate.nextSibling );
			}
		}
	} );
}
