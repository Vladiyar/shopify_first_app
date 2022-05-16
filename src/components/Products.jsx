import {useCallback, useEffect, useMemo, useState} from "react";
import {
    Filters,
    ResourceItem,
    ResourceList,
    TextStyle,
    Card,
    Banner, Pagination, Thumbnail
} from "@shopify/polaris";
import {gql, useLazyQuery} from "@apollo/client";
import {Error} from "@shopify/app-bridge/actions";
import {useClientRouting, useRoutePropagation} from "@shopify/app-bridge-react";
import {useLocation, useNavigate, useSearchParams} from "react-router-dom";


export function Products() {
    const [queryValue, setQueryValue] = useState(null);
    const [searchParams, setSearchParams] = useSearchParams({sortValue: 'TITLE', reversed: 'false'});
    const handleQueryValueChange = useCallback((value) => setQueryValue(value), []);
    const handleQueryValueRemove = useCallback(() => setQueryValue(null), []);
    const handleClearAll = useCallback(() => {handleQueryValueRemove()}, [handleQueryValueRemove]);
    const memoQueryValue = useMemo(() => queryValue,[queryValue])
    const location = useLocation();
    const navigate = useNavigate();
    useRoutePropagation(location);
    useClientRouting({
        replace(path) {
            navigate(path);
        }
    });

    const GET_PRODUCTS = gql`
        query ($reversed: Boolean, $lastProducts: Int, $firstProducts: Int, $directionAfter: String, $directionBefore: String, $sort: ProductSortKeys, $query: String) {
          products(reverse: $reversed, sortKey: $sort, first: $firstProducts, last: $lastProducts, after: $directionAfter, before: $directionBefore, query: $query) {
            edges {
              cursor
              node {
                title
                createdAt
                productType
                vendor
                id
                description
            \t}
            }
            
            pageInfo {
              hasPreviousPage
              hasNextPage
              startCursor
              endCursor
            }
          }
        }

    `;

    const [getData, {loading, error, data, previousData}] = useLazyQuery(GET_PRODUCTS, {
        fetchPolicy: 'no-cache',
    });

    useEffect(() => {
        if (!loading) {
           getData({
                variables: {
                    "firstProducts": 5,
                    "directionAfter": null,
                    "sort": searchParams.get('sortValue'),
                }
            });
        }
    }, [])

    const timerFunc = () => {
        if (!queryValue) return;
        getData(
            {
                variables: {
                    "sort": searchParams.get('sortValue'),
                    "firstProducts": 5,
                    "reversed": true,
                    "query": memoQueryValue
                }
            }
        )
    }

    useEffect(() => {
        let timer1 = setTimeout(() => timerFunc(), 1500)
        return () => {
            clearTimeout(timer1)
        }
    }, [queryValue])

    const onClickNext = useCallback(() => {
        getData({
            variables: {
                "firstProducts": 5,
                "directionAfter": data.products.pageInfo.endCursor,
                "sort": searchParams.get('sortValue'),
                "reversed": searchParams.get('reversed')
            }
        })
    }, [getData, data]);

    const onClickPrevious = useCallback(() => {
        getData({
            variables: {
                "lastProducts": 5,
                "directionBefore": data.products.pageInfo.startCursor,
                "sort": searchParams.get('sortValue'),
                "reversed": searchParams.get('reversed')
            }
        })
    }, [getData, data]);


    const onChangeSort = (input) => {

        if (input === 'TITLE') {
            getData({ variables: {
                    "sort": 'TITLE',
                    "firstProducts": 5,
                }
            });
            setSearchParams({sortValue: input, reversed: false})
            return;
        }
        if (input === 'REVERSED_TITLE') {
            getData({ variables: {
                    "sort": "TITLE",
                    "firstProducts": 5,
                    "reversed": true
                }
            });
            setSearchParams({sortValue: 'TITLE', reversed: false})
            return;
        }
        if (input === 'PUBLISHED_AT') {
            getData({ variables: {
                    "sort": "PUBLISHED_AT",
                    "firstProducts": 5
                }
            });
            setSearchParams({sortValue: input, reversed: false})
            return;
        }
        if (input === 'REVERSED_DATE') {
            getData({ variables: {
                    "sort": "PUBLISHED_AT",
                    "firstProducts": 5,
                    "reversed": true
                }
            });
            setSearchParams({sortValue: "PUBLISHED_AT", reversed: true})
            return;
        }
        if (input === 'PRODUCT_TYPE') {
            getData({
                variables: {
                    "sort": "PRODUCT_TYPE",
                    "firstProducts": 5,
                }
            });
            setSearchParams({sortValue: input, reversed: false})
        }
    }

    if (error) {
        return <Error message={error.message}/>
    }

    const resourceName = {
        singular: 'product',
        plural: 'products',
    };

    const filterControl = (
        <Filters
            queryValue={queryValue}
            filters={[]}
            onQueryChange={handleQueryValueChange}
            onQueryClear={handleQueryValueRemove}
            onClearAll={handleClearAll}
        />
    );

    return (
        <Card>
            <ResourceList
                loading={loading}
                resourceName={resourceName}
                items={data ? data.products.edges : (previousData ? previousData.products.edges : [] )}
                renderItem={renderItem}
                sortOptions={[
                    {label: 'Newest update', value: 'PUBLISHED_AT'},
                    {label: 'Oldest update', value: 'REVERSED_DATE'},
                    {label: 'Alphabetically(A-z)', value: 'TITLE'},
                    {label: 'Alphabetically(Z-a)', value: 'REVERSED_TITLE'},
                    {label: 'Product type', value: 'PRODUCT_TYPE'},

                ]}
                onSortChange={(selected) => {
                    setSearchParams({sortValue: selected})
                    onChangeSort(selected);

                }}
                sortValue={searchParams.get('sortValue')}
                filterControl={filterControl}
            />

            <Pagination
                hasPrevious={data ? data.products.pageInfo.hasPreviousPage: false}
                onPrevious={() => {
                onClickPrevious()
            }} onNext={() => {
                onClickNext()
            }}
                hasNext={data ? data.products.pageInfo.hasNextPage : false}/>

        </Card>
    );

    function renderItem(item) {
        const {node: {id, title, description, vendor, productType}} = item;
        const media = <Thumbnail
            source="https://burst.shopifycdn.com/photos/black-leather-choker-necklace_373x@2x.jpg"
            size="large"
            alt="Black choker necklace"
        />

        return (
            <ResourceItem
                media={media}
                id={id}>
                <h3>
                    <TextStyle variation="strong">{title}</TextStyle>
                </h3>
                <div>{description}</div>
                <div>{productType}</div>
                <div>{vendor}</div>
            </ResourceItem>
        );
    }
}