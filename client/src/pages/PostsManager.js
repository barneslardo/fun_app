import React, { Component, Fragment } from "react";
import { withAuth } from "@okta/okta-react";
import { withRouter, Route, Redirect, Link } from "react-router-dom";
import {
  withStyles,
  Typography,
  Button,
  IconButton,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction
} from "@material-ui/core";
import { Delete as DeleteIcon, Add as AddIcon } from "@material-ui/icons";
import moment from "moment";
import { find, orderBy } from "lodash";
import { compose } from "recompose";

import PostEditor from "../components/PostEditor";

const styles = theme => ({
  posts: {
    marginTop: 2 * theme.spacing.unit
  },
  fab: {
    position: "absolute",
    bottom: 3 * theme.spacing.unit,
    right: 3 * theme.spacing.unit,
    [theme.breakpoints.down("xs")]: {
      bottom: 2 * theme.spacing.unit,
      right: 2 * theme.spacing.unit
    }
  }
});

const API = process.env.REACT_APP_API || "http://localhost:3001";

class PostsManager extends Component {
  state = {
    loading: true,
    posts: []
  };

  componentDidMount() {
    this.getPosts();
  }

  async fetch(method, endpoint, body) {
    try {
      const response = await fetch(`${API}${endpoint}`, {
        method,
        body: body && JSON.stringify(body),
        headers: {
          "content-type": "application/json",
          accept: "application/json",
          authorization: `Bearer ${await this.props.auth.getAccessToken()}`
        }
      });
      return await response.json();
    } catch (error) {
      console.error(error);
    }
  }

  async getPosts() {
    this.setState({ loading: false, posts: await this.fetch("get", "/post") });
  }

  savePost = async post => {
    if (post.id) {
      await this.fetch("put", `/post/${post.id}`, post);
    } else {
      await this.fetch("post", "/post", post);
    }

    this.props.history.goBack();
    this.getPosts();
  };

  async deletePost(post) {
    if (window.confirm(`Are you sure you want to delete "${post.name}"`)) {
      await this.fetch("delete", `/post/${post.id}`);
      this.getPosts();
    }
  }

  renderPostEditor = ({
    match: {
      params: { id }
    }
  }) => {
    if (this.state.loading) return null;
    const post = find(this.state.posts, { id: Number(id) });

    if (!post && id !== "new") return <Redirect to="/post" />;

    return <PostEditor post={post} onSave={this.savePost} />;
  };

  render() {
    const { classes } = this.props;

    return (
      <Fragment>
        <h1 className="wacky my-5">Posts Manager</h1>
        {this.state.posts.length > 0 ? (
          <Paper elevation={1} className={classes.posts}>
            <List>
              {orderBy(
                this.state.posts,
                ["updatedAt", "name"],
                ["desc", "asc"]
              ).map(post => (
                <ListItem
                  key={post.id}
                  button
                  component={Link}
                  to={`/posts/${post.id}`}
                >
                  <ListItemText
                    primary={post.name}
                    secondary={
                      post.updatedAt &&
                      `Updated ${moment(post.updatedAt).fromNow()}`
                    }
                  />
                  <ListItemSecondaryAction>
                    <IconButton
                      onClick={() => this.deletePost(post)}
                      color="inherit"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          </Paper>
        ) : (
          !this.state.loading && (
            <Typography variant="subheading">No posts to display</Typography>
          )
        )}
        <Button
          variant="fab"
          color="secondary"
          aria-label="add"
          className={classes.fab}
          component={Link}
          to="/posts/new"
        >
          <AddIcon />
        </Button>
        <Route exact path="/posts/:id" render={this.renderPostEditor} />
      </Fragment>
    );
  }
}

export default compose(
  withAuth,
  withRouter,
  withStyles(styles)
)(PostsManager);
