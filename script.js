'use strict';

const br = React.createElement(
    "br",
    null,
    null
);

function Button(props) {
    return React.createElement(
        "button",
        {
            onClick: props.handleClick
        },
        props.name
    )
}

let MyName = function MyName(props) {
    return React.createElement(
        "div",
        null,
        "Hello ",
        props.name
    );
};

class MyComponent extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            num: 0,
            input: ""
        }
    }
    handleIncrement = () => {
        this.setState({
            num: this.state.num + 1
        })
    }
    handleDecrement = () => {
        this.setState({
            num: this.state.num - 1
        })
    }
    handleFormChange = (event) => {
        this.setState({
            input: event.target.value
        })
    }
    render() {
        return React.createElement(
            "div", 
            {style: 
                {
                color: "blue",
                marginTop: 10
                }
            }, 
            "Hello ", 
            this.props.name, 
            br,
            React.createElement(
                "div",
                {style: {color: "black"}},
                `Hello ${this.props.toWhat}`
            ),
            React.createElement(
                Button,
                {
                    handleClick: this.handleIncrement,
                    name: "Increment"
                },
                null
            ),
            React.createElement(
                Button,
                {
                    handleClick: this.handleDecrement,
                    name: "Decrement"
                },
                null
            ),
            React.createElement(
                "div",
                null,
                this.state.num
            ),
            React.createElement(BadgeList, null, null),
            React.createElement(MyName, {name: this.state.input}, null),
            React.createElement(
                "input", 
                {
                    value: this.state.input,
                    onChange: this.handleFormChange
                }, 
                null
            )
        )
    }
}


class Badge extends React.Component {
    constructor(props) {
        super(props);
    }
    render() {
        return (
            React.createElement(
                "div",
                null,
                this.props.name
            )
        )
    }
}

class BadgeList extends React.Component {
    render() {
        return React.createElement(
            "div",
            {style: {color: "green"}},
            React.createElement(Badge, { name: "Bill" }, null),
            React.createElement(Badge, { name: "Tom" }, null)
        )
    }
}

/*
let BadgeList = React.createClass({
    render: function render() {
        return React.createElement(
            "div",
            null,
            React.createElement(Badge, { name: "Bill" }),
            React.createElement(Badge, { name: "Tom" })
        );
    }
});
*/

ReactDOM.render(
    React.createElement(
        MyComponent, 
        { 
            name: 'John', 
            toWhat: 'World' 
        }, 
        null), 
    document.querySelector("#app")
);